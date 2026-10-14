-- Altavista Residences — imóveis PÚBLICOS (vitrine do site, fora do acervo off market).
--
-- São cadastrados só pela equipe, no painel (Anúncios). Ficam separados do acervo
-- off market (tabela `properties`) de propósito: nada daqui se mistura com os
-- cadastros reservados de proprietários. Dados do dono ficam em `listing_private`,
-- legível só pela equipe. Fotos em bucket PÚBLICO `listing-media`.
--
-- Rode no SQL Editor do Supabase depois de 0001, 0002 e 0003.

create table listings (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title          text not null,
  location       text not null,                 -- ex.: "Condomínio Fazenda Boa Vista, Porto Feliz/SP"
  region_id      uuid references regions (id) on delete set null,
  status         text not null default 'disponivel' check (status in ('disponivel', 'exclusivo', 'vendido')),
  price          numeric,                       -- null => "Sob consulta"
  built_area_m2  numeric,
  land_area_m2   numeric,
  bedrooms       int,
  suites         int,
  parking        int,
  description    text,
  highlights     text[] not null default '{}',
  -- [{ "path": "...", "alt": "..." }] no bucket público `listing-media`
  images         jsonb not null default '[]'::jsonb,
  featured       boolean not null default false,  -- aparece em destaque na home
  published      boolean not null default false,  -- rascunho (false) só a equipe vê
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index listings_published_idx on listings (published, created_at desc);
create trigger listings_touch before update on listings
  for each row execute function touch_updated_at();

-- Dados internos do anúncio (nunca vão para o site).
create table listing_private (
  listing_id   uuid primary key references listings (id) on delete cascade,
  owner_name   text,
  owner_phone  text,
  owner_email  text,
  notes        text
);

alter table listings        enable row level security;
alter table listing_private enable row level security;

create policy listings_read on listings for select to anon, authenticated
  using (published or is_staff());
create policy listings_staff_insert on listings for insert to authenticated with check (is_staff());
create policy listings_staff_update on listings for update to authenticated
  using (is_staff()) with check (is_staff());
create policy listings_admin_delete on listings for delete to authenticated using (is_admin());

create policy listing_private_staff on listing_private for all to authenticated
  using (is_staff()) with check (is_staff());

-- Fotos públicas: qualquer pessoa lê; só a equipe envia/troca; só admin apaga.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('listing-media', 'listing-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy listing_media_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'listing-media');
create policy listing_media_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-media' and is_staff());
create policy listing_media_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'listing-media' and is_staff());
create policy listing_media_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'listing-media' and is_staff());
