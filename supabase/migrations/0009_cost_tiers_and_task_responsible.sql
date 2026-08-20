-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — escalões/mínimo no orçamento + responsável pela tarefa
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0008 já aplicados.
--
-- Duas melhorias pedidas depois de rever o módulo já construído, sem relação
-- direta entre si mas pequenas o suficiente para irem na mesma migração
-- (mesmo padrão de 0002_task_priority_vendor_status.sql).
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Preço por escalão etário e mínimo contratual ────────────────────────
-- Duas formas alternativas de refinar uma linha "por pessoa" — mutuamente
-- exclusivas por desenho, não só por convenção da interface:
--
--   per_category = true   → cobra unit_price_cents (adultos),
--                            unit_price_child_cents e unit_price_baby_cents
--                            por cada escalão confirmado. Não usa mínimo:
--                            um mínimo contratual sobre um total composto de
--                            três preços diferentes não tem uma resposta óbvia
--                            de qual escalão absorve a diferença.
--   min_quantity definido  → cobra sempre pelo menos min_quantity pessoas ao
--   (per_category = false)   preço normal (unit_price_cents), e quem exceder
--                            paga a extra_unit_price_cents — ou ao preço
--                            normal, se essa coluna ficar por preencher.
--
-- Nenhuma das duas mexe no caso comum (per_category=false, min_quantity nulo):
-- continua a ser só unit_price_cents × confirmados, como sempre foi.

alter table public.event_costs
  add column if not exists per_category boolean not null default false,
  add column if not exists unit_price_child_cents integer not null default 0,
  add column if not exists unit_price_baby_cents integer not null default 0,
  add column if not exists min_quantity integer,
  add column if not exists extra_unit_price_cents integer;


-- ── 2. Responsável pela tarefa ──────────────────────────────────────────────
-- Até aqui uma tarefa só tinha visibilidade (agência/partilhada) — nada
-- distinguia "trabalho da agência que o casal vê" de "tarefa que É do casal".
-- Isso fazia tarefas dos próprios noivos (escolher o vestido, tratar da
-- documentação) aparecerem só na lista de trabalho da agência.
--
-- A constraint a seguir torna impossível, ao nível da base de dados, voltar a
-- ter essa inconsistência: uma tarefa cujo responsável não é só a agência tem
-- sempre de ser partilhada. Não depende de nenhum código se lembrar disso.

alter table public.event_tasks
  add column if not exists responsible text not null default 'agency';

alter table public.event_tasks drop constraint if exists event_tasks_responsible_check;
alter table public.event_tasks
  add constraint event_tasks_responsible_check
  check (responsible in ('agency', 'couple', 'both'));

alter table public.event_tasks drop constraint if exists event_tasks_responsible_visibility_check;
alter table public.event_tasks
  add constraint event_tasks_responsible_visibility_check
  check (responsible = 'agency' or visibility = 'shared');
