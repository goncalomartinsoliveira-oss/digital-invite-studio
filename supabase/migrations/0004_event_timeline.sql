-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — Fase 2: cronograma do dia
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0003 já aplicados (usa as funções de permissões
-- criadas em 0001).
--
-- Nota sobre visibilidade: ao contrário de event_costs/event_tasks/
-- event_documents (privados por omissão), o cronograma nasce **partilhado**
-- — é literalmente o horário do próprio dia do casal, não informação
-- interna da agência. A agência pode esconder um bloco específico (ex.: uma
-- surpresa) trocando para 'agency' nesse bloco.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.event_timeline (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  event_time        time not null,
  duration_minutes  integer,
  title             text not null,
  notes             text,
  vendor_id         uuid references public.agency_vendors(id) on delete set null,
  visibility        text not null default 'shared'
                      check (visibility in ('agency', 'shared')),
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists event_timeline_invitation_idx on public.event_timeline (invitation_id, event_time);

alter table public.event_timeline enable row level security;

drop policy if exists event_timeline_read on public.event_timeline;
create policy event_timeline_read on public.event_timeline
  for select using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_read_event(invitation_id))
  );

drop policy if exists event_timeline_insert on public.event_timeline;
create policy event_timeline_insert on public.event_timeline
  for insert with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  );

drop policy if exists event_timeline_update on public.event_timeline;
create policy event_timeline_update on public.event_timeline
  for update using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  );

drop policy if exists event_timeline_delete on public.event_timeline;
create policy event_timeline_delete on public.event_timeline
  for delete using (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  );
