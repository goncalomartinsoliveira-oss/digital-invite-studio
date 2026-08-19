-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — prioridade nas tarefas + estado do contrato e
-- histórico de notas por fornecedor
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume que 0001_planner_module.sql já foi aplicado (usa as
-- funções dis_is_agency_for_event / dis_can_read_event / dis_is_super_admin
-- criadas lá).
--
-- Motivo: ao comparar com um concorrente direto ao casal (não a agências),
-- duas coisas do "Fornecedores" dele eram expectativa mínima e faltavam-nos:
-- prioridade nas tarefas, e estado do contrato + histórico de reuniões por
-- fornecedor. O estado do contrato fica em event_costs (é uma relação
-- evento-fornecedor: o mesmo fornecedor pode estar "contratado" num
-- casamento e "em negociação" noutro), não em agency_vendors.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Prioridade das tarefas ───────────────────────────────────────────────

alter table public.event_tasks
  add column if not exists priority text not null default 'normal';

alter table public.event_tasks drop constraint if exists event_tasks_priority_check;
alter table public.event_tasks
  add constraint event_tasks_priority_check
  check (priority in ('baixa', 'normal', 'alta'));


-- ── 2. Estado do contrato por linha de custo ───────────────────────────────
-- Independente do estado de pagamento (event_cost_payments): esta é a fase
-- da relação com o fornecedor, aquela é o dinheiro.

alter table public.event_costs
  add column if not exists status text not null default 'a_orcar';

alter table public.event_costs drop constraint if exists event_costs_status_check;
alter table public.event_costs
  add constraint event_costs_status_check
  check (status in ('a_orcar', 'orcamento_pedido', 'em_negociacao', 'contratado', 'cancelado'));


-- ── 3. Histórico de notas / reuniões por linha de custo ────────────────────
-- Mesmo padrão de event_cost_payments: invitation_id desnormalizado para
-- manter as políticas simples, sem join a cada leitura. Sempre da agência —
-- notas de reunião não fazem sentido partilhadas com o casal, ao contrário
-- dos custos/tarefas, por isso não tem campo `visibility`.

create table if not exists public.event_cost_notes (
  id                uuid primary key default gen_random_uuid(),
  cost_id           uuid not null references public.event_costs(id) on delete cascade,
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  note              text not null,
  created_by_email  text,
  created_at        timestamptz not null default now()
);

create index if not exists event_cost_notes_cost_idx on public.event_cost_notes (cost_id);
create index if not exists event_cost_notes_invitation_idx on public.event_cost_notes (invitation_id, created_at);

alter table public.event_cost_notes enable row level security;

drop policy if exists event_cost_notes_read on public.event_cost_notes;
create policy event_cost_notes_read on public.event_cost_notes
  for select using (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  );

drop policy if exists event_cost_notes_write on public.event_cost_notes;
create policy event_cost_notes_write on public.event_cost_notes
  for all using (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  ) with check (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  );
