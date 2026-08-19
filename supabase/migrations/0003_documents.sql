-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — Fase 1b: documentos/contratos
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001 e 0002 já aplicados (usa as funções de permissões
-- criadas em 0001).
--
-- O histórico de preços por fornecedor (a outra metade da Fase 1b) não
-- precisa de tabela nova — é uma consulta a event_costs por vendor_id em
-- todos os eventos da marca. Só esta parte (documentos/contratos) tem
-- esquema novo.
-- ═══════════════════════════════════════════════════════════════════════════

-- Documentos por evento, opcionalmente ligados a um fornecedor específico
-- (cost_id nulo = documento geral do evento, ex.: contrato do espaço que
-- cobre várias linhas). Mesma lógica de visibilidade de event_costs/
-- event_tasks — privado por omissão, o casal só vê o que for partilhado.

create table if not exists public.event_documents (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  cost_id           uuid references public.event_costs(id) on delete set null,
  name              text not null,
  file_url          text not null,
  visibility        text not null default 'agency'
                      check (visibility in ('agency', 'shared')),
  uploaded_by_email text,
  created_at        timestamptz not null default now()
);

create index if not exists event_documents_invitation_idx on public.event_documents (invitation_id);
create index if not exists event_documents_cost_idx on public.event_documents (cost_id);

alter table public.event_documents enable row level security;

drop policy if exists event_documents_read on public.event_documents;
create policy event_documents_read on public.event_documents
  for select using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_read_event(invitation_id))
  );

drop policy if exists event_documents_insert on public.event_documents;
create policy event_documents_insert on public.event_documents
  for insert with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  );

drop policy if exists event_documents_delete on public.event_documents;
create policy event_documents_delete on public.event_documents
  for delete using (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  );
