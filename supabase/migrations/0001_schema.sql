-- Altavista Residences — esquema inicial (Etapas 3 a 5 do briefing).
-- Rode no SQL Editor do Supabase (ou `supabase db push`). Idempotência não é
-- garantida: aplique uma vez em cada ambiente (homologação e produção).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Equipe (perfis administrador e corretor)
-- ---------------------------------------------------------------------------

create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  role        text not null check (role in ('admin', 'corretor')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and active)
$$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and active and role = 'admin')
$$;

-- ---------------------------------------------------------------------------
-- Conteúdo do site
-- ---------------------------------------------------------------------------

create table regions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  subtitle    text,
  body        text,
  -- [{ "path": "...", "alt": "..." }] no bucket público `region-media`
  images      jsonb not null default '[]'::jsonb,
  show_count  boolean not null default false,
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Termos versionados; o aceite grava a versão que a pessoa viu.
create table terms (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('proprietario', 'comprador')),
  version     int not null,
  body        text not null,
  active      boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (kind, version)
);
create unique index terms_one_active_per_kind on terms (kind) where active;

-- ---------------------------------------------------------------------------
-- Proprietários e imóveis
-- ---------------------------------------------------------------------------

create table owners (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  whatsapp            text not null,           -- só dígitos, com DDI
  email               text not null,
  terms_version       int not null,
  terms_accepted_at   timestamptz not null default now(),
  created_at          timestamptz not null default now()
);
create unique index owners_whatsapp_key on owners (whatsapp);

create table properties (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid not null references owners (id) on delete cascade,
  region_id               uuid not null references regions (id),
  location_detail         text not null,       -- condomínio / bairro
  land_area_m2            numeric,
  built_area_m2           numeric,
  bedrooms                int,
  suites                  int,
  parking                 int,
  highlights              text,
  asking_price            numeric,
  accepts_buyer_contact   boolean not null default false,
  status                  text not null default 'em_analise'
    check (status in ('em_analise', 'ajuste_solicitado', 'recusado', 'no_acervo', 'vendido', 'pausado')),
  review_note             text,
  reviewed_by             uuid references profiles (id),
  reviewed_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index properties_status_idx on properties (status);
create index properties_region_idx on properties (region_id);

create table property_media (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties (id) on delete cascade,
  path         text not null unique,           -- no bucket privado `property-media`
  kind         text not null check (kind in ('foto', 'planta', 'video')),
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index property_media_property_idx on property_media (property_id);

-- ---------------------------------------------------------------------------
-- Compradores e conversas
-- ---------------------------------------------------------------------------

create table buyers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  cpf                 text not null unique,    -- só dígitos
  whatsapp            text not null,
  email               text not null,
  region_ids          uuid[] not null default '{}',
  price_min           numeric,
  price_max           numeric,
  property_profile    text,
  kind                text not null check (kind in ('corretor', 'final')),
  status              text not null default 'aguardando'
    check (status in ('aguardando', 'aprovado', 'recusado')),
  review_note         text,
  reviewed_by         uuid references profiles (id),
  reviewed_at         timestamptz,
  terms_version       int not null,
  terms_accepted_at   timestamptz not null default now(),
  created_at          timestamptz not null default now()
);
create index buyers_status_idx on buyers (status);
create index buyers_whatsapp_idx on buyers (whatsapp);

-- Cada mensagem trocada (comprador, agente de IA ou equipe) e cada foto enviada.
create table interactions (
  id                uuid primary key default gen_random_uuid(),
  buyer_id          uuid not null references buyers (id) on delete cascade,
  property_id       uuid references properties (id) on delete set null,
  direction         text not null check (direction in ('comprador', 'agente', 'equipe')),
  message           text,
  photos_sent       jsonb not null default '[]'::jsonb,
  handed_to_human   boolean not null default false,
  created_at        timestamptz not null default now()
);
create index interactions_buyer_idx on interactions (buyer_id, created_at);

-- ---------------------------------------------------------------------------
-- Log de acesso (quem viu/alterou o quê)
-- ---------------------------------------------------------------------------

create table access_log (
  id         bigint generated always as identity primary key,
  user_id    uuid references profiles (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  detail     jsonb,
  at         timestamptz not null default now()
);
create index access_log_at_idx on access_log (at desc);

-- ---------------------------------------------------------------------------
-- Gatilhos
-- ---------------------------------------------------------------------------

create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger properties_touch before update on properties
  for each row execute function touch_updated_at();

-- Carimba quem decidiu e quando; registra no log toda mudança de status.
create function audit_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_by = auth.uid();
    new.reviewed_at = now();
    insert into access_log (user_id, action, entity, entity_id, detail)
    values (auth.uid(), 'status', tg_table_name, new.id,
            jsonb_build_object('de', old.status, 'para', new.status, 'nota', new.review_note));
  end if;
  return new;
end $$;
create trigger properties_audit before update on properties
  for each row execute function audit_status_change();
create trigger buyers_audit before update on buyers
  for each row execute function audit_status_change();
