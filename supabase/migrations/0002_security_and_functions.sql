-- Altavista Residences — permissões (RLS), funções públicas/internas e buckets.
--
-- Princípios:
--   * Visitantes (anon) NÃO leem nada além de regiões ativas, termos ativos e
--     contagens públicas. Cadastros entram só pelas funções submit_owner /
--     submit_buyer, que validam tudo no servidor.
--   * Equipe (profiles ativos) lê e modera. Só administrador mexe em regiões,
--     termos, equipe, log e exclusão de dados.
--   * Fotos ficam em bucket PRIVADO; a equipe as vê por link temporário.

alter table profiles       enable row level security;
alter table regions        enable row level security;
alter table terms          enable row level security;
alter table owners         enable row level security;
alter table properties     enable row level security;
alter table property_media enable row level security;
alter table buyers         enable row level security;
alter table interactions   enable row level security;
alter table access_log     enable row level security;

-- Equipe ----------------------------------------------------------------------
create policy profiles_read_self_or_admin on profiles for select to authenticated
  using (id = auth.uid() or is_admin());
create policy profiles_admin_write on profiles for all to authenticated
  using (is_admin()) with check (is_admin());

-- Regiões e termos: leitura pública do que está ativo --------------------------
create policy regions_read on regions for select to anon, authenticated
  using (active or is_staff());
create policy regions_admin_write on regions for all to authenticated
  using (is_admin()) with check (is_admin());

create policy terms_read on terms for select to anon, authenticated
  using (active or is_staff());
create policy terms_admin_write on terms for all to authenticated
  using (is_admin()) with check (is_admin());

-- Dados dos cadastros: só equipe -----------------------------------------------
create policy owners_staff_read on owners for select to authenticated using (is_staff());
create policy owners_admin_delete on owners for delete to authenticated using (is_admin());

create policy properties_staff_read on properties for select to authenticated using (is_staff());
create policy properties_staff_update on properties for update to authenticated
  using (is_staff()) with check (is_staff());
create policy properties_admin_delete on properties for delete to authenticated using (is_admin());

create policy media_staff_read on property_media for select to authenticated using (is_staff());

create policy buyers_staff_read on buyers for select to authenticated using (is_staff());
create policy buyers_staff_update on buyers for update to authenticated
  using (is_staff()) with check (is_staff());
create policy buyers_admin_delete on buyers for delete to authenticated using (is_admin());

create policy interactions_staff_read on interactions for select to authenticated using (is_staff());
create policy interactions_staff_insert on interactions for insert to authenticated
  with check (is_staff() and direction = 'equipe');

create policy access_log_admin_read on access_log for select to authenticated using (is_admin());

-- ---------------------------------------------------------------------------
-- Validação de CPF
-- ---------------------------------------------------------------------------

create function valid_cpf(c text) returns boolean language plpgsql immutable as $$
declare s int; d1 int; d2 int; i int;
begin
  if c !~ '^\d{11}$' or c ~ '^(\d)\1{10}$' then return false; end if;
  s := 0;
  for i in 1..9 loop s := s + substr(c, i, 1)::int * (11 - i); end loop;
  d1 := (s * 10) % 11; if d1 = 10 then d1 := 0; end if;
  s := 0;
  for i in 1..10 loop s := s + substr(c, i, 1)::int * (12 - i); end loop;
  d2 := (s * 10) % 11; if d2 = 10 then d2 := 0; end if;
  return d1 = substr(c, 10, 1)::int and d2 = substr(c, 11, 1)::int;
end $$;

-- ---------------------------------------------------------------------------
-- Cadastro público do PROPRIETÁRIO
-- ---------------------------------------------------------------------------
-- As fotos já foram enviadas pelo navegador para `incoming/{submission_id}/…`
-- (única pasta onde visitantes podem gravar; não podem ler nem listar).

create function submit_owner(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_sub      uuid := (p->>'submission_id')::uuid;
  v_wa       text := regexp_replace(coalesce(p->>'whatsapp', ''), '\D', '', 'g');
  v_email    text := lower(trim(coalesce(p->>'email', '')));
  v_name     text := trim(coalesce(p->>'name', ''));
  v_term     int;
  v_owner    uuid;
  v_prop     uuid;
  v_media    jsonb;
  v_photos   int := 0;
  i          int;
begin
  if (select count(*) from properties where created_at > now() - interval '1 minute') > 30 then
    raise exception 'Muitas solicitações. Tente novamente em instantes.';
  end if;

  if length(v_name) < 3 or length(v_name) > 120 then raise exception 'Nome inválido.'; end if;
  if length(v_wa) < 10 or length(v_wa) > 15 then raise exception 'WhatsApp inválido.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if coalesce((p->>'terms_accepted')::boolean, false) is not true then
    raise exception 'É necessário aceitar o termo.';
  end if;
  if not exists (select 1 from regions where id = (p->>'region_id')::uuid and active) then
    raise exception 'Região inválida.';
  end if;
  if length(trim(coalesce(p->>'location_detail', ''))) < 2 then
    raise exception 'Informe o condomínio ou bairro.';
  end if;

  select version into v_term from terms where kind = 'proprietario' and active;
  if v_term is null then raise exception 'Termo indisponível.'; end if;

  v_media := coalesce(p->'media', '[]'::jsonb);
  if jsonb_array_length(v_media) > 32 then raise exception 'Arquivos demais.'; end if;
  for i in 0 .. jsonb_array_length(v_media) - 1 loop
    if (v_media->i->>'path') not like 'incoming/' || v_sub::text || '/%' then
      raise exception 'Arquivo inválido.';
    end if;
    if (v_media->i->>'kind') = 'foto' then v_photos := v_photos + 1; end if;
  end loop;
  if v_photos < 1 then raise exception 'Envie ao menos uma foto.'; end if;
  if v_photos > 30 then raise exception 'Máximo de 30 fotos.'; end if;

  -- Proprietário que já cadastrou outro imóvel reaproveita o registro.
  select id into v_owner from owners where whatsapp = v_wa;
  if v_owner is null then
    insert into owners (name, whatsapp, email, terms_version)
    values (v_name, v_wa, v_email, v_term)
    returning id into v_owner;
  end if;

  insert into properties (
    owner_id, region_id, location_detail, land_area_m2, built_area_m2,
    bedrooms, suites, parking, highlights, asking_price, accepts_buyer_contact
  ) values (
    v_owner,
    (p->>'region_id')::uuid,
    trim(p->>'location_detail'),
    nullif(p->>'land_area_m2', '')::numeric,
    nullif(p->>'built_area_m2', '')::numeric,
    nullif(p->>'bedrooms', '')::int,
    nullif(p->>'suites', '')::int,
    nullif(p->>'parking', '')::int,
    nullif(trim(coalesce(p->>'highlights', '')), ''),
    nullif(p->>'asking_price', '')::numeric,
    coalesce((p->>'accepts_buyer_contact')::boolean, false)
  ) returning id into v_prop;

  for i in 0 .. jsonb_array_length(v_media) - 1 loop
    insert into property_media (property_id, path, kind, position)
    values (v_prop, v_media->i->>'path', v_media->i->>'kind', i);
  end loop;

  return v_prop;
end $$;

-- ---------------------------------------------------------------------------
-- Cadastro público do COMPRADOR
-- ---------------------------------------------------------------------------
-- Resposta sempre igual, exista ou não o CPF, para não revelar quem já é cadastrado.

create function submit_buyer(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_cpf      text := regexp_replace(coalesce(p->>'cpf', ''), '\D', '', 'g');
  v_wa       text := regexp_replace(coalesce(p->>'whatsapp', ''), '\D', '', 'g');
  v_email    text := lower(trim(coalesce(p->>'email', '')));
  v_name     text := trim(coalesce(p->>'name', ''));
  v_regions  uuid[];
  v_term     int;
  v_min      numeric := nullif(p->>'price_min', '')::numeric;
  v_max      numeric := nullif(p->>'price_max', '')::numeric;
begin
  if (select count(*) from buyers where created_at > now() - interval '1 minute') > 30 then
    raise exception 'Muitas solicitações. Tente novamente em instantes.';
  end if;

  if length(v_name) < 3 or length(v_name) > 120 then raise exception 'Nome inválido.'; end if;
  if not valid_cpf(v_cpf) then raise exception 'CPF inválido.'; end if;
  if length(v_wa) < 10 or length(v_wa) > 15 then raise exception 'WhatsApp inválido.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if (p->>'kind') not in ('corretor', 'final') then raise exception 'Informe se é corretor ou comprador final.'; end if;
  if coalesce((p->>'terms_accepted')::boolean, false) is not true then
    raise exception 'É necessário aceitar o termo.';
  end if;
  if v_min is not null and v_max is not null and v_min > v_max then
    raise exception 'Faixa de valor inválida.';
  end if;

  select array_agg(x::uuid) into v_regions from jsonb_array_elements_text(coalesce(p->'region_ids', '[]')) x;
  if v_regions is null
     or (select count(*) from regions where id = any(v_regions) and active) <> cardinality(v_regions) then
    raise exception 'Região inválida.';
  end if;

  select version into v_term from terms where kind = 'comprador' and active;
  if v_term is null then raise exception 'Termo indisponível.'; end if;

  insert into buyers (
    name, cpf, whatsapp, email, region_ids, price_min, price_max,
    property_profile, kind, terms_version
  ) values (
    v_name, v_cpf, v_wa, v_email, v_regions, v_min, v_max,
    nullif(trim(coalesce(p->>'property_profile', '')), ''), p->>'kind', v_term
  ) on conflict (cpf) do nothing;

  return 'ok';
end $$;

-- ---------------------------------------------------------------------------
-- Funções públicas e internas
-- ---------------------------------------------------------------------------

-- Quantidade de imóveis no acervo por região — só das regiões com show_count.
create function region_public_counts() returns table (region_id uuid, total int)
language sql stable security definer set search_path = public as $$
  select r.id, (select count(*)::int from properties p where p.region_id = r.id and p.status = 'no_acervo')
  from regions r where r.active and r.show_count
$$;

-- Compradores aprovados compatíveis com um imóvel (região + faixa de valor).
create function compatible_buyers(p_property uuid) returns setof buyers
language sql stable security invoker as $$
  select b.* from buyers b join properties p on p.id = p_property
  where b.status = 'aprovado'
    and p.region_id = any (b.region_ids)
    and (p.asking_price is null
         or ((b.price_min is null or p.asking_price >= b.price_min)
         and (b.price_max is null or p.asking_price <= b.price_max)))
  order by b.created_at
$$;

-- Imóveis no acervo compatíveis com um comprador.
create function compatible_properties(p_buyer uuid) returns setof properties
language sql stable security invoker as $$
  select p.* from properties p join buyers b on b.id = p_buyer
  where p.status = 'no_acervo'
    and p.region_id = any (b.region_ids)
    and (p.asking_price is null
         or ((b.price_min is null or p.asking_price >= b.price_min)
         and (b.price_max is null or p.asking_price <= b.price_max)))
  order by p.created_at desc
$$;

create function dashboard_counters() returns jsonb
language sql stable security invoker as $$
  select jsonb_build_object(
    'properties', coalesce((select jsonb_object_agg(status, n)
                            from (select status, count(*) n from properties group by status) s), '{}'::jsonb),
    'buyers', coalesce((select jsonb_object_agg(status, n)
                        from (select status, count(*) n from buyers group by status) s), '{}'::jsonb),
    'signups', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', to_char(d, 'YYYY-MM-DD'),
        'proprietarios', (select count(*) from owners o where (o.created_at at time zone 'America/Sao_Paulo')::date = d),
        'compradores',   (select count(*) from buyers b where (b.created_at at time zone 'America/Sao_Paulo')::date = d)
      ) order by d)
      from (select generate_series(
              (now() at time zone 'America/Sao_Paulo')::date - 13,
              (now() at time zone 'America/Sao_Paulo')::date, interval '1 day')::date d) days
    ), '[]'::jsonb)
  )
$$;

-- Registro de acesso feito pelo painel (abrir cadastro, ver fotos, exportar…).
create function log_access(p_action text, p_entity text, p_entity_id uuid default null, p_detail jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if is_staff() then
    insert into access_log (user_id, action, entity, entity_id, detail)
    values (auth.uid(), p_action, p_entity, p_entity_id, p_detail);
  end if;
end $$;

-- Publica nova versão do termo e a torna vigente, de forma atômica.
create function publish_term(p_kind text, p_body text) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not is_admin() then raise exception 'Sem permissão.'; end if;
  select coalesce(max(version), 0) + 1 into v from terms where kind = p_kind;
  update terms set active = false where kind = p_kind and active;
  insert into terms (kind, version, body, active) values (p_kind, v, p_body, true);
  insert into access_log (user_id, action, entity, detail)
    values (auth.uid(), 'publicar', 'terms', jsonb_build_object('kind', p_kind, 'version', v));
  return v;
end $$;

-- Permissões de execução: nada além do necessário para visitantes.
-- (O Supabase concede execução a anon/authenticated por padrão; revogamos tudo e liberamos o necessário.)
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function submit_owner(jsonb), submit_buyer(jsonb), region_public_counts()
  to anon, authenticated;
-- is_staff() entra em políticas lidas também por visitantes (regions, terms).
grant execute on function is_staff() to anon, authenticated;
grant execute on function is_admin(), publish_term(text, text), compatible_buyers(uuid),
  compatible_properties(uuid), dashboard_counters(), log_access(text, text, uuid, jsonb)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Armazenamento
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('property-media', 'property-media', false, 262144000,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime']),
  ('region-media', 'region-media', true, 8388608,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Visitantes só ENVIAM para `incoming/…` (sem leitura nem listagem).
create policy property_media_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'property-media' and name like 'incoming/%');
create policy property_media_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'property-media' and is_staff());
create policy property_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'property-media' and is_admin());

create policy region_media_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'region-media');
create policy region_media_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'region-media' and is_admin());
create policy region_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'region-media' and is_admin());
create policy region_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'region-media' and is_admin());

-- ---------------------------------------------------------------------------
-- Dados iniciais (textos provisórios — editáveis pelo painel)
-- ---------------------------------------------------------------------------

insert into regions (slug, name, subtitle, body, sort_order) values
  ('baronesa', 'Baronesa', 'Condomínio Fazenda da Baronesa', 'Texto da região a ser definido pela equipe.', 1),
  ('grama', 'Grama', 'Condomínio Fazenda da Grama', 'Texto da região a ser definido pela equipe.', 2),
  ('boa-vista', 'Boa Vista', 'Fazenda Boa Vista, Porto Feliz/SP', 'Texto da região a ser definido pela equipe.', 3),
  ('sao-paulo', 'São Paulo', 'Jardins, Itaim, Vila Nova Conceição', 'Texto da região a ser definido pela equipe.', 4);

insert into terms (kind, version, body, active) values
  ('proprietario', 1, 'Termo de sigilo e autorização de apresentação a compradores selecionados. (Texto jurídico a ser fornecido.)', true),
  ('comprador', 1, 'Termo de confidencialidade. (Texto jurídico a ser fornecido.)', true);

-- Primeiro administrador: crie o usuário em Authentication > Users e rode
--   insert into profiles (id, name, role) values ('<uuid do usuário>', 'Nome', 'admin');
