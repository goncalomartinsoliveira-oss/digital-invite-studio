-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — orçamento total por evento
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0007 já aplicados.
--
-- Até aqui o "orçamentado" era preenchido linha a linha (event_costs.
-- budgeted_cents) e o total era a soma dessas linhas. Na prática ninguém
-- orça assim: o casal chega com um número global ("temos 25 mil") e a
-- pergunta que interessa é quanto desse bolo já está comprometido. Passa a
-- haver um único valor por evento, e as linhas de custo só registam o custo
-- real.
--
-- O valor vive em `invitations` (e não numa tabela do módulo) porque é do
-- evento, não da agência: quem já pode editar o evento pode editá-lo, sem
-- políticas novas. Não é informação sensível da agência — é o orçamento do
-- próprio casal, que eles conhecem melhor do que ninguém.
--
-- event_costs.budgeted_cents NÃO é apagada: a coluna fica na base de dados
-- (já sem uso na aplicação) para não destruir o que lá estiver. O update
-- abaixo soma-a para o novo campo, para nada se perder na transição.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.invitations
  add column if not exists planner_budget_total_cents integer not null default 0;

-- Só preenche quem ainda está a zero, para uma segunda corrida não pisar um
-- valor entretanto editado à mão no painel.
update public.invitations i
set planner_budget_total_cents = coalesce(sub.total, 0)
from (
  select invitation_id, sum(budgeted_cents) as total
  from public.event_costs
  group by invitation_id
) sub
where sub.invitation_id = i.id
  and i.planner_budget_total_cents = 0
  and coalesce(sub.total, 0) > 0;
