-- Altavista Residences — cadastro manual de compradores e acesso (e-mail + senha).
--
-- Enquanto o WhatsApp oficial não está disponível, a equipe cadastra o comprador
-- no painel e, ao aprová-lo, cria uma senha de acesso e a envia por conta própria.
-- O comprador entra em /entrar e vê em /acervo os imóveis compatíveis com o perfil
-- dele, SEM endereço/condomínio, proprietário ou fotos (fotos aguardam a marca d'água).
--
-- Rode no SQL Editor do Supabase depois de 0001 e 0002.

-- ---------------------------------------------------------------------------
-- Colunas novas
-- ---------------------------------------------------------------------------

alter table buyers
  add column user_id uuid unique references auth.users (id) on delete set null,
  add column source  text not null default 'site' check (source in ('site', 'manual'));

-- ---------------------------------------------------------------------------
-- Cadastro manual feito pela equipe
-- ---------------------------------------------------------------------------

create function staff_create_buyer(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_cpf      text := regexp_replace(coalesce(p->>'cpf', ''), '\D', '', 'g');
  v_wa       text := regexp_replace(coalesce(p->>'whatsapp', ''), '\D', '', 'g');
  v_email    text := lower(trim(coalesce(p->>'email', '')));
  v_name     text := trim(coalesce(p->>'name', ''));
  v_min      numeric := nullif(p->>'price_min', '')::numeric;
  v_max      numeric := nullif(p->>'price_max', '')::numeric;
  v_approve  boolean := coalesce((p->>'approve')::boolean, false);
  v_regions  uuid[];
  v_term     int;
  v_id       uuid;
begin
  if not is_staff() then raise exception 'Sem permissão.'; end if;

  if length(v_name) < 3 or length(v_name) > 120 then raise exception 'Nome inválido.'; end if;
  if not valid_cpf(v_cpf) then raise exception 'CPF inválido.'; end if;
  if length(v_wa) < 10 or length(v_wa) > 15 then raise exception 'WhatsApp inválido.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if (p->>'kind') not in ('corretor', 'final') then raise exception 'Informe se é corretor ou comprador final.'; end if;
  if v_min is not null and v_max is not null and v_min > v_max then
    raise exception 'Faixa de valor inválida.';
  end if;
  if exists (select 1 from buyers where cpf = v_cpf) then
    raise exception 'Já existe um comprador com este CPF.';
  end if;

  select array_agg(x::uuid) into v_regions from jsonb_array_elements_text(coalesce(p->'region_ids', '[]')) x;
  if v_regions is null
     or (select count(*) from regions where id = any(v_regions) and active) <> cardinality(v_regions) then
    raise exception 'Região inválida.';
  end if;

  select version into v_term from terms where kind = 'comprador' and active;
  if v_term is null then raise exception 'Termo indisponível.'; end if;

  insert into buyers (
    name, cpf, whatsapp, email, region_ids, price_min, price_max, property_profile,
    kind, terms_version, source, status, reviewed_by, reviewed_at, review_note
  ) values (
    v_name, v_cpf, v_wa, v_email, v_regions, v_min, v_max,
    nullif(trim(coalesce(p->>'property_profile', '')), ''), p->>'kind', v_term, 'manual',
    case when v_approve then 'aprovado' else 'aguardando' end,
    case when v_approve then auth.uid() end,
    case when v_approve then now() end,
    'Cadastro manual pela equipe (aceite do termo confirmado pela equipe).'
  ) returning id into v_id;

  insert into access_log (user_id, action, entity, entity_id, detail)
  values (auth.uid(), 'cadastro_manual', 'buyers', v_id, jsonb_build_object('aprovado', v_approve));

  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Acesso do comprador (cria/atualiza o usuário de login com a senha informada)
-- ---------------------------------------------------------------------------
-- Escreve direto em auth.users/auth.identities (formato do GoTrue). Só a equipe
-- executa, e só para compradores aprovados. A senha nunca é gravada em claro.

create function set_buyer_access(p_buyer uuid, p_password text) returns text
language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  b   buyers%rowtype;
  uid uuid;
begin
  if not is_staff() then raise exception 'Sem permissão.'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'A senha precisa ter ao menos 8 caracteres.'; end if;

  select * into b from buyers where id = p_buyer;
  if not found then raise exception 'Comprador não encontrado.'; end if;
  if b.status <> 'aprovado' then raise exception 'Aprove o comprador antes de criar o acesso.'; end if;

  if b.user_id is not null then
    update auth.users
       set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
     where id = b.user_id;
  else
    if exists (select 1 from auth.users where lower(email) = b.email) then
      raise exception 'Este e-mail já está em uso por outro acesso.';
    end if;
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', b.email,
      crypt(p_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text,
            jsonb_build_object('sub', uid::text, 'email', b.email, 'email_verified', true),
            'email', now(), now(), now());
    update buyers set user_id = uid where id = b.id;
  end if;

  insert into access_log (user_id, action, entity, entity_id)
  values (auth.uid(), 'acesso_criado', 'buyers', b.id);

  return b.email;
end $$;

create function revoke_buyer_access(p_buyer uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not is_staff() then raise exception 'Sem permissão.'; end if;
  select user_id into uid from buyers where id = p_buyer;
  if uid is not null then
    delete from auth.users where id = uid;   -- buyers.user_id volta a null (on delete set null)
    insert into access_log (user_id, action, entity, entity_id)
    values (auth.uid(), 'acesso_removido', 'buyers', p_buyer);
  end if;
end $$;

-- Perdeu a aprovação → perde o login. Excluído (LGPD) → o login some junto.
create function buyers_drop_login() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_op = 'DELETE' then
    if old.user_id is not null then delete from auth.users where id = old.user_id; end if;
    return old;
  end if;
  if new.status <> 'aprovado' and old.user_id is not null then
    delete from auth.users where id = old.user_id;
  end if;
  return new;
end $$;
create trigger buyers_drop_login_upd after update of status on buyers
  for each row execute function buyers_drop_login();
create trigger buyers_drop_login_del after delete on buyers
  for each row execute function buyers_drop_login();

-- ---------------------------------------------------------------------------
-- Área do comprador: o que ele pode ver (nunca condomínio, proprietário ou fotos)
-- ---------------------------------------------------------------------------

create function my_acervo() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare b buyers%rowtype;
begin
  select * into b from buyers where user_id = auth.uid() and status = 'aprovado';
  if not found then return null; end if;

  return jsonb_build_object(
    'name', b.name,
    'properties', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'region', r.name,
        'land_area_m2', p.land_area_m2,
        'built_area_m2', p.built_area_m2,
        'bedrooms', p.bedrooms,
        'suites', p.suites,
        'parking', p.parking,
        'highlights', p.highlights,
        'asking_price', p.asking_price
      ) order by p.created_at desc)
      from properties p join regions r on r.id = p.region_id
      where p.status = 'no_acervo'
        and p.region_id = any (b.region_ids)
        and (p.asking_price is null
             or ((b.price_min is null or p.asking_price >= b.price_min)
             and (b.price_max is null or p.asking_price <= b.price_max)))
    ), '[]'::jsonb)
  );
end $$;

-- Permissões (o Supabase concede execução a anon por padrão).
revoke execute on function staff_create_buyer(jsonb), set_buyer_access(uuid, text),
  revoke_buyer_access(uuid), my_acervo(), buyers_drop_login() from public, anon, authenticated;
grant execute on function staff_create_buyer(jsonb), set_buyer_access(uuid, text),
  revoke_buyer_access(uuid), my_acervo() to authenticated;
