-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — Moodboard do evento
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0005 já aplicados.
--
-- Mural de inspiração partilhado entre agência e casal — organizado em
-- secções (Identidade Visual, Vestido & Fato, ...), com uma lista de
-- omissão que a app semeia sozinha na primeira vez que o evento abre esta
-- área (ver DEFAULT_MOODBOARD_SECTIONS em lib/moodboard.ts); a agência/casal
-- pode acrescentar secções próprias além dessas. Cada imagem/link pertence
-- a uma secção, mas `section_id` fica nulo se essa secção for apagada
-- (on delete set null, não cascade) — apagar uma secção não pode apagar as
-- fotos lá dentro, só deixá-las por arrumar.
--
-- Ao contrário de Orçamento/Tarefas, não há distinção agency/shared — não
-- há aqui nada sensível a esconder do casal.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.event_moodboard_sections (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  name              text not null,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists event_moodboard_sections_invitation_idx on public.event_moodboard_sections (invitation_id, sort_order);

alter table public.event_moodboard_sections enable row level security;

drop policy if exists event_moodboard_sections_read on public.event_moodboard_sections;
create policy event_moodboard_sections_read on public.event_moodboard_sections
  for select using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_read_event(invitation_id)
  );

drop policy if exists event_moodboard_sections_insert on public.event_moodboard_sections;
create policy event_moodboard_sections_insert on public.event_moodboard_sections
  for insert with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );

drop policy if exists event_moodboard_sections_update on public.event_moodboard_sections;
create policy event_moodboard_sections_update on public.event_moodboard_sections
  for update using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );

drop policy if exists event_moodboard_sections_delete on public.event_moodboard_sections;
create policy event_moodboard_sections_delete on public.event_moodboard_sections
  for delete using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );

create table if not exists public.event_moodboard_items (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  section_id        uuid references public.event_moodboard_sections(id) on delete set null,
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
create index if not exists event_moodboard_items_section_idx on public.event_moodboard_items (section_id);

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
