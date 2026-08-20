-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — Moodboard do evento
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0005 já aplicados.
--
-- Mural de inspiração partilhado entre agência e casal — imagens carregadas
-- ou links colados (Pinterest/Instagram, com miniatura extraída pelo
-- servidor, ver app/api/moodboard/unfurl). Ao contrário de Orçamento/
-- Tarefas, não tem distinção agency/shared: não há aqui nada sensível a
-- esconder do casal, por isso é sempre visível a quem já pode ver o evento.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.event_moodboard_items (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  kind              text not null check (kind in ('image', 'link')),
  image_url         text,   -- ficheiro carregado, ou miniatura extraída do link (pode ser nulo se a extração falhar)
  source_url        text,   -- só para kind='link': o link original colado
  caption           text,
  created_by_email  text,
  created_at        timestamptz not null default now(),
  constraint event_moodboard_items_content_check check (
    (kind = 'image' and image_url is not null)
    or (kind = 'link' and source_url is not null)
  )
);

create index if not exists event_moodboard_items_invitation_idx on public.event_moodboard_items (invitation_id, created_at);

alter table public.event_moodboard_items enable row level security;

drop policy if exists event_moodboard_items_read on public.event_moodboard_items;
create policy event_moodboard_items_read on public.event_moodboard_items
  for select using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_read_event(invitation_id)
  );

drop policy if exists event_moodboard_items_insert on public.event_moodboard_items;
create policy event_moodboard_items_insert on public.event_moodboard_items
  for insert with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );

drop policy if exists event_moodboard_items_update on public.event_moodboard_items;
create policy event_moodboard_items_update on public.event_moodboard_items
  for update using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );

drop policy if exists event_moodboard_items_delete on public.event_moodboard_items;
create policy event_moodboard_items_delete on public.event_moodboard_items
  for delete using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );
