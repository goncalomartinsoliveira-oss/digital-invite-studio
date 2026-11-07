-- ═══════════════════════════════════════════════════════════════════════════
-- Privacidade: convidados, livro de visitas e fotos (RGPD)
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0017 aplicadas e o deploy do código que acompanha esta
-- migração (api/rsvp e api/seating): sem ele, o RSVP do link geral e a página
-- "Encontre a sua mesa" deixam de encontrar convidados.
--
-- Antes, com a chave pública do site (que está no browser), qualquer pessoa
-- podia: ler os convidados de todos os eventos (nomes, notas, contactos) e
-- alterá-los; ler as mensagens do livro de visitas de todos os eventos; e,
-- com uma conta qualquer, apagar fotos e imagens de qualquer evento.
--
--   guests      — só a equipa do evento (dono, colaboradores, agência, super
--                 admin) lê e escreve. O RSVP público passa pelo servidor
--                 (api/rsvp, api/guest-link, api/seating), que só devolve os
--                 nomes pesquisados e só grava o grupo de quem responde.
--   guestbook   — os convidados continuam a escrever; só a equipa lê.
--   Storage     — fotos_evento: só a equipa do evento apaga; os áudios/vídeos
--                 privados do livro de visitas (private_*) só aparecem na
--                 listagem à equipa. invites: só super admin apaga (a limpeza
--                 usa o servidor).
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Funções auxiliares ──────────────────────────────────────────────────

-- Lê o evento: dono, colaborador (qualquer papel), agência ou super admin.
create or replace function public.dis_reads_event(inv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dis_can_read_event(inv)
      or public.dis_is_agency_for_event(inv)
      or public.dis_is_super_admin();
$$;

-- Gere o evento: dono, editor, agência ou super admin.
create or replace function public.dis_manages_event(inv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dis_can_edit_event(inv)
      or public.dis_is_agency_for_event(inv)
      or public.dis_is_super_admin();
$$;

-- O mesmo, a partir da pasta de um ficheiro ("<evento>/<nome>").
create or replace function public.dis_reads_event_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case when folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then public.dis_reads_event(folder::uuid) else false end;
$$;

create or replace function public.dis_manages_event_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case when folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then public.dis_manages_event(folder::uuid) else false end;
$$;


-- ── 2. guests: só a equipa do evento ───────────────────────────────────────

drop policy if exists "Busca pública" on public.guests;
drop policy if exists "Convidado confirma" on public.guests;
drop policy if exists g_select on public.guests;
drop policy if exists g_insert on public.guests;
drop policy if exists g_update on public.guests;

drop policy if exists guests_team_select on public.guests;
create policy guests_team_select on public.guests
  for select to authenticated
  using (public.dis_reads_event(invitation_id::uuid));

drop policy if exists guests_team_insert on public.guests;
create policy guests_team_insert on public.guests
  for insert to authenticated
  with check (public.dis_manages_event(invitation_id::uuid));

drop policy if exists guests_team_update on public.guests;
create policy guests_team_update on public.guests
  for update to authenticated
  using (public.dis_manages_event(invitation_id::uuid))
  with check (public.dis_manages_event(invitation_id::uuid));

-- Mantêm-se: "Dono gere tudo", g_delete e as regras de fim de prazo.


-- ── 3. guestbook: convidados escrevem, só a equipa lê ─────────────────────

drop policy if exists gb_select on public.guestbook;
drop policy if exists gb_team_select on public.guestbook;
create policy gb_team_select on public.guestbook
  for select to authenticated
  using (public.dis_reads_event(invitation_id::uuid));

-- Mantêm-se: gb_insert (com o limite de experiência da 0016), gb_update,
-- gb_delete e a regra de fim de prazo.


-- ── 4. Storage ─────────────────────────────────────────────────────────────

drop policy if exists objects_delete_authenticated on storage.objects;

drop policy if exists fotos_evento_delete_team on storage.objects;
create policy fotos_evento_delete_team on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos_evento' and public.dis_manages_event_folder(split_part(name, '/', 1)));

drop policy if exists invites_delete_super_admin on storage.objects;
create policy invites_delete_super_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'invites' and public.dis_is_super_admin());

-- Listagem pública das fotos sem os áudios/vídeos privados do livro de visitas.
drop policy if exists fotos_evento_select on storage.objects;
drop policy if exists fotos_evento_select_public on storage.objects;
create policy fotos_evento_select_public on storage.objects
  for select to public
  using (
    bucket_id = 'fotos_evento'
    and (split_part(name, '/', 2) not like 'private\_%'
         or public.dis_reads_event_folder(split_part(name, '/', 1)))
  );
