-- ═══════════════════════════════════════════════════════════════════════════
-- Proteções de pagamento e permissões na base de dados
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0015 já aplicados.
--
-- O painel nunca deixa os noivos ou os parceiros publicarem sem pagar, mas o
-- browser fala diretamente com o Supabase: sem isto, alguém com conhecimentos
-- técnicos podia, com a sua própria sessão, ativar módulos, inventar
-- pagamentos ou comissões, ou tornar-se membro de um parceiro. Estas regras
-- aplicam-se a TODAS as escritas, sejam quais forem as políticas RLS antigas.
--
-- Quem passa sempre ("privilegiado"): o servidor (service_role: checkout,
-- webhook do Stripe, limpeza, recomendações) e os super admins.
--
--   invitations   — módulos ativos, datas de bloqueio/fim/limpeza, recomendação,
--                   marca e dono só mudam por um privilegiado. "Quem paga"
--                   (paid_by) só pela equipa do parceiro dono do evento. Ao
--                   criar um evento: dono = quem cria, sem módulos nem
--                   recomendação, e só com uma marca a que a pessoa tenha
--                   direito (DIS, a sua agência, ou um domínio de parceiro).
--   payments, coupons, brands, brand_members, super_admins, partner_accounts
--                 — escrita só por privilegiados.
--   invitation_collaborators
--                 — só quem edita o evento (dono, editor, agência) gere a equipa.
--   guestbook, fotos_evento (Storage)
--                 — modo de experiência: 5 mensagens / 5 fotos até pagar.
--   guests        — o RSVP público só funciona com o convite publicado; a lista
--                   preparada no painel (dono, editores, agência) continua livre.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Quem é privilegiado ─────────────────────────────────────────────────
-- IMPORTANTE: dis_is_privileged e as funções dos triggers são SECURITY INVOKER
-- (o padrão), para current_user ser o papel real de quem escreve (anon,
-- authenticated, service_role). Dentro de uma função SECURITY DEFINER,
-- current_user passava a ser o dono da função e toda a gente seria
-- "privilegiada". As leituras que têm de passar por cima do RLS (contagens,
-- permissões) ficam nas funções auxiliares SECURITY DEFINER abaixo.

create or replace function public.dis_is_privileged()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select current_user in ('service_role', 'postgres', 'supabase_admin')
      or coalesce(auth.role(), '') = 'service_role'
      or public.dis_is_super_admin();
$$;

create or replace function public.dis_guestbook_count(inv uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from guestbook where invitation_id = inv;
$$;

create or replace function public.dis_trial_photo_count(inv uuid)
returns int
language sql
stable
security definer
set search_path = public, storage
as $$
  select count(*)::int from storage.objects o
  where o.bucket_id = 'fotos_evento'
    and split_part(o.name, '/', 1) = inv::text
    and split_part(o.name, '/', 2) not like 'private\_%'
    and split_part(o.name, '/', 2) <> '.emptyFolderPlaceholder';
$$;

create or replace function public.dis_event_exists(inv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from invitations where id = inv);
$$;

-- Módulo ativo num evento? Funciona com unlocked_modules em text[] ou jsonb.
create or replace function public.dis_event_has_module(inv uuid, module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from invitations i
    where i.id = inv
      and coalesce(i.unlocked_modules::text, '') ~ ('(^|[^a-z_])' || module || '([^a-z_]|$)')
  );
$$;

-- Marcas com domínio próprio definidas em código (lib/brands.ts). Quem se
-- regista nesse domínio cria eventos dessa marca sem ser membro dela.
-- Acrescentar aqui quando entrar uma marca nova com domínio em código.
create or replace function public.dis_open_signup_brand(b text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select b = any (array['amazingmoon'])
      or exists (select 1 from brands where id = b and domain is not null and domain <> '');
$$;


-- ── 2. invitations ─────────────────────────────────────────────────────────
-- O nome começa por "trg_a_" para correr antes do trg_protect_locked_event_date
-- (os triggers correm por ordem alfabética), que pode acertar datas depois.

create or replace function public.dis_guard_invitations()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.dis_is_privileged() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if lower(coalesce(new.user_email, '')) <> public.dis_current_email() or public.dis_current_email() = '' then
      raise exception 'dis_guard: o dono do evento tem de ser quem o cria' using errcode = '42501';
    end if;
    if coalesce(new.unlocked_modules::text, '{}') not in ('{}', '[]')
       or new.date_locked_at is not null
       or new.referred_by_brand_id is not null or new.referred_at is not null
       or new.paid_by is not null
       or new.content_purged_at is not null or new.expiry_notice_sent_at is not null then
      raise exception 'dis_guard: campos de pagamento não podem ser definidos ao criar um evento' using errcode = '42501';
    end if;
    if new.expires_at is not null and new.event_date is not null
       and new.expires_at > (new.event_date::timestamp + interval '61 days') then
      raise exception 'dis_guard: fim de prazo inválido' using errcode = '42501';
    end if;
    if coalesce(new.brand_id, 'dis') <> 'dis'
       and not public.dis_is_agency_for_brand(new.brand_id)
       and not public.dis_open_signup_brand(new.brand_id) then
      raise exception 'dis_guard: sem permissão para criar eventos desta marca' using errcode = '42501';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.unlocked_modules is distinct from old.unlocked_modules
     or new.date_locked_at is distinct from old.date_locked_at
     or new.expires_at is distinct from old.expires_at
     or new.content_purged_at is distinct from old.content_purged_at
     or new.expiry_notice_sent_at is distinct from old.expiry_notice_sent_at
     or new.referred_by_brand_id is distinct from old.referred_by_brand_id
     or new.referred_at is distinct from old.referred_at
     or new.brand_id is distinct from old.brand_id
     or new.user_email is distinct from old.user_email then
    raise exception 'dis_guard: só o servidor ou um super admin podem alterar estes campos' using errcode = '42501';
  end if;
  if new.paid_by is distinct from old.paid_by
     and not public.dis_is_agency_for_brand(old.brand_id) then
    raise exception 'dis_guard: só a equipa do parceiro escolhe quem paga' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_a_guard_invitations on public.invitations;
create trigger trg_a_guard_invitations
  before insert or update on public.invitations
  for each row execute function public.dis_guard_invitations();


-- ── 3. Tabelas só de privilegiados ─────────────────────────────────────────

create or replace function public.dis_guard_privileged_only()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.dis_is_privileged() then
    raise exception 'dis_guard: escrita reservada ao servidor e aos super admins (%)', tg_table_name using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['payments', 'coupons', 'brands', 'brand_members', 'super_admins', 'partner_accounts'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists trg_a_guard_privileged on public.%I', t);
      execute format('create trigger trg_a_guard_privileged before insert or update or delete on public.%I for each row execute function public.dis_guard_privileged_only()', t);
    end if;
  end loop;
end $$;


-- ── 4. invitation_collaborators: só quem edita o evento ────────────────────

create or replace function public.dis_guard_collaborators()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare inv uuid;
begin
  if public.dis_is_privileged() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  inv := case when tg_op = 'DELETE' then old.invitation_id else new.invitation_id end;
  if not (public.dis_can_edit_event(inv) or public.dis_is_agency_for_event(inv))
     or (tg_op = 'UPDATE' and new.invitation_id is distinct from old.invitation_id) then
    raise exception 'dis_guard: só quem edita o evento gere a equipa do evento' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_a_guard_collaborators on public.invitation_collaborators;
create trigger trg_a_guard_collaborators
  before insert or update or delete on public.invitation_collaborators
  for each row execute function public.dis_guard_collaborators();


-- ── 5. Modo de experiência: livro de visitas (5 mensagens até pagar) ──────

create or replace function public.dis_guard_guestbook_trial()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.dis_is_privileged() or public.dis_event_has_module(new.invitation_id, 'guestbook') then
    return new;
  end if;
  if public.dis_guestbook_count(new.invitation_id) >= 5 then
    raise exception 'dis_trial_limit: o livro de visitas aceita 5 mensagens até o convite ser publicado' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_a_guard_guestbook_trial on public.guestbook;
create trigger trg_a_guard_guestbook_trial
  before insert on public.guestbook
  for each row execute function public.dis_guard_guestbook_trial();


-- ── 6. Modo de experiência: fotos (5 até pagar), bucket fotos_evento ───────
-- Ficheiros "<evento>/<nome>". Os "private_*" são áudio/vídeo do livro de
-- visitas e contam como mensagens; os restantes contam como fotos (como em
-- api/trial). Caminhos que não são de um evento não são afetados.

create or replace function public.dis_trial_upload_ok(object_name text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  inv uuid;
  fname text := split_part(object_name, '/', 2);
  n int;
begin
  if public.dis_is_privileged() then
    return true;
  end if;
  begin
    inv := split_part(object_name, '/', 1)::uuid;
  exception when others then
    return true;
  end;
  if not public.dis_event_exists(inv) then
    return true;
  end if;
  if fname like 'private\_%' then
    if public.dis_event_has_module(inv, 'guestbook') then return true; end if;
    n := public.dis_guestbook_count(inv);
  else
    if public.dis_event_has_module(inv, 'photo_sharing') then return true; end if;
    n := public.dis_trial_photo_count(inv);
  end if;
  return n < 5;
end;
$$;

drop policy if exists "dis_trial_limit_fotos_evento" on storage.objects;
create policy "dis_trial_limit_fotos_evento" on storage.objects
  as restrictive
  for insert
  to public
  with check (bucket_id <> 'fotos_evento' or public.dis_trial_upload_ok(name));


-- ── 7. RSVP público só com o convite publicado ─────────────────────────────
-- O dono, os editores e a agência preparam a lista à vontade antes de pagar;
-- as respostas dos convidados (sem sessão de quem gere) exigem o convite ativo.

create or replace function public.dis_guard_guests_rsvp()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare inv uuid;
begin
  if public.dis_is_privileged() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  inv := case when tg_op = 'DELETE' then old.invitation_id else new.invitation_id end;
  if public.dis_can_edit_event(inv) or public.dis_is_agency_for_event(inv) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if not public.dis_event_has_module(inv, 'invite') then
    raise exception 'dis_guard: o RSVP só funciona com o convite publicado' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_a_guard_guests_rsvp on public.guests;
create trigger trg_a_guard_guests_rsvp
  before insert or update or delete on public.guests
  for each row execute function public.dis_guard_guests_rsvp();
