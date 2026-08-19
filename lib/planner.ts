import type { SupabaseClient } from "@supabase/supabase-js";

// ── Módulo Wedding Planner ───────────────────────────────────────────────────
// A área de gestão (orçamento, tarefas, fornecedores) é exclusiva de contas de
// agência. O interruptor está na conta de parceiro (`brands.planner_plan`), não
// na pessoa: o diretório de fornecedores, o histórico de preços e a vista de
// conjunto pertencem à agência, e é a agência que subscreve quando os planos
// entrarem. Quem, dentro da agência, pode editar continua a ser decidido pelos
// membros de marca (brand_members), como em todo o resto do painel.

export type PlannerPlan = "piloto" | "solo" | "profissional" | "agencia";

export type PlannerPlanInfo = {
  id: PlannerPlan;
  name: string;
  /** Eventos ativos em simultâneo. null = sem limite definido (piloto). */
  activeEvents: number | null;
  priceCentsMonthly: number | null;
};

// Dimensionados a partir do pipeline real: um casamento entra na plataforma
// 12-18 meses antes de acontecer, por isso os eventos ativos em simultâneo são
// ~1,2× os casamentos por ano. Limites folgados de propósito — se as vagas
// forem escassas, a agência adia criar o evento para as poupar, e isso atrasa
// o site e o RSVP do casal, que é o contrário do que queremos.
export const PLANNER_PLANS: Record<PlannerPlan, PlannerPlanInfo> = {
  piloto:       { id: "piloto",       name: "Piloto",       activeEvents: null, priceCentsMonthly: null },
  solo:         { id: "solo",         name: "Solo",         activeEvents: 6,    priceCentsMonthly: 3900 },
  profissional: { id: "profissional", name: "Profissional", activeEvents: 15,   priceCentsMonthly: 8900 },
  agencia:      { id: "agencia",      name: "Agência",      activeEvents: 35,   priceCentsMonthly: 16900 },
};

export const ALL_PLANNER_PLANS = Object.keys(PLANNER_PLANS) as PlannerPlan[];

export function isPlannerPlan(value: unknown): value is PlannerPlan {
  return typeof value === "string" && (ALL_PLANNER_PLANS as string[]).includes(value);
}

/**
 * Plano de wedding planner da marca deste evento, ou null se não for uma conta
 * de agência. As marcas definidas em código (lib/brands.ts) não vivem na tabela
 * `brands`, por isso nunca têm plano — uma agência piloto tem de ser criada
 * como parceiro na base de dados.
 */
export async function fetchPlannerPlan(
  sb: SupabaseClient,
  brandId: string | null | undefined
): Promise<PlannerPlan | null> {
  if (!brandId || brandId === "dis") return null;
  const { data } = await sb.from("brands").select("planner_plan").eq("id", brandId).maybeSingle();
  return isPlannerPlan(data?.planner_plan) ? data.planner_plan : null;
}

// ── Custos ───────────────────────────────────────────────────────────────────

export type CostPricingMode = "fixed" | "per_person";
export type PlannerVisibility = "agency" | "shared";

// Fase da relação com o fornecedor nesta linha — independente de estar paga
// ou não (isso é event_cost_payments). O mesmo fornecedor pode estar
// "contratado" num casamento e "em negociação" noutro, por isso vive aqui e
// não em agency_vendors.
export type CostStatus = "a_orcar" | "orcamento_pedido" | "em_negociacao" | "contratado" | "cancelado";

export const COST_STATUSES: CostStatus[] = ["a_orcar", "orcamento_pedido", "em_negociacao", "contratado", "cancelado"];

export const COST_STATUS_LABELS: Record<CostStatus, string> = {
  a_orcar: "A orçar",
  orcamento_pedido: "Orçamento pedido",
  em_negociacao: "Em negociação",
  contratado: "Contratado",
  cancelado: "Cancelado",
};

export type EventCost = {
  id: string;
  invitation_id: string;
  vendor_id: string | null;
  category: string;
  description: string | null;
  pricing_mode: CostPricingMode;
  unit_price_cents: number;
  quantity: number;
  budgeted_cents: number;
  vat_pct: number;
  status: CostStatus;
  visibility: PlannerVisibility;
  notes: string | null;
  sort_order: number;
};

// Histórico de notas/reuniões por linha de custo — sempre da agência, nunca
// partilhado com o casal (por isso não tem `visibility`, ao contrário de
// EventCost/EventTask).
export type CostNote = {
  id: string;
  cost_id: string;
  invitation_id: string;
  note: string;
  created_by_email: string | null;
  created_at: string;
};

export type CostPayment = {
  id: string;
  cost_id: string;
  invitation_id: string;
  label: string | null;
  amount_cents: number;
  due_date: string | null;
  paid_at: string | null;
};

export const COST_CATEGORIES = [
  "espaco",
  "catering",
  "bebidas",
  "decoracao",
  "flores",
  "fotografia",
  "video",
  "musica",
  "bolo",
  "convites",
  "beleza",
  "vestuario",
  "transporte",
  "honorarios",
  "outros",
] as const;

export const DEFAULT_VAT_PCT = 23;

/**
 * Quantidade efetiva de uma linha. Em `per_person` vem dos convidados
 * confirmados e move-se sozinha à medida que os RSVP entram — é este o ponto
 * que nenhum concorrente consegue copiar sem ter primeiro um produto de RSVP.
 */
export function effectiveQuantity(cost: EventCost, confirmedGuests: number): number {
  return cost.pricing_mode === "per_person" ? confirmedGuests : (cost.quantity || 0);
}

/** Valor da linha sem IVA. */
export function costNetCents(cost: EventCost, confirmedGuests: number): number {
  return Math.round(cost.unit_price_cents * effectiveQuantity(cost, confirmedGuests));
}

/** Valor da linha com IVA aplicado. */
export function costGrossCents(cost: EventCost, confirmedGuests: number): number {
  const net = costNetCents(cost, confirmedGuests);
  return Math.round(net * (1 + (cost.vat_pct || 0) / 100));
}

export type BudgetTotals = {
  budgeted: number;
  net: number;
  gross: number;
  paid: number;
  outstanding: number;
  overdue: number;
};

/**
 * Totais do orçamento. `outstanding` é o que está previsto em marcos de
 * pagamento e ainda não foi pago; `overdue` é a parte disso que já passou do
 * prazo — é o número que interessa à agência de manhã.
 */
export function budgetTotals(
  costs: EventCost[],
  payments: CostPayment[],
  confirmedGuests: number,
  today: Date = new Date()
): BudgetTotals {
  const todayISO = today.toISOString().slice(0, 10);
  const totals: BudgetTotals = { budgeted: 0, net: 0, gross: 0, paid: 0, outstanding: 0, overdue: 0 };

  for (const c of costs) {
    totals.budgeted += c.budgeted_cents || 0;
    totals.net += costNetCents(c, confirmedGuests);
    totals.gross += costGrossCents(c, confirmedGuests);
  }

  for (const p of payments) {
    if (p.paid_at) {
      totals.paid += p.amount_cents || 0;
    } else {
      totals.outstanding += p.amount_cents || 0;
      if (p.due_date && p.due_date < todayISO) totals.overdue += p.amount_cents || 0;
    }
  }

  return totals;
}

// ── Tarefas ──────────────────────────────────────────────────────────────────

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "baixa" | "normal" | "alta";

export const TASK_PRIORITIES: TaskPriority[] = ["baixa", "normal", "alta"];
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = { baixa: "Baixa", normal: "Normal", alta: "Alta" };
// Ordem de urgência para ordenar (maior primeiro).
export const TASK_PRIORITY_WEIGHT: Record<TaskPriority, number> = { alta: 2, normal: 1, baixa: 0 };

export type EventTask = {
  id: string;
  invitation_id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  due_offset_days: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_email: string | null;
  visibility: PlannerVisibility;
  sort_order: number;
};

/**
 * Data-limite a partir de "N dias antes do casamento". Guardar o desvio (e não
 * só a data) é o que permite recalcular os prazos todos se a data do evento
 * mudar — sem isto, mudar a data obriga a reescrever a checklist à mão.
 */
export function dueDateFromOffset(eventDate: string | null | undefined, offsetDays: number | null): string | null {
  if (!eventDate || offsetDays === null || offsetDays === undefined) return null;
  const d = new Date(eventDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

export function isOverdue(task: EventTask, today: Date = new Date()): boolean {
  if (task.status === "done" || !task.due_date) return false;
  return task.due_date < today.toISOString().slice(0, 10);
}

// ── Formatação ───────────────────────────────────────────────────────────────

export function formatCents(cents: number, locale = "pt-PT"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
}

/** Converte "1.234,56" ou "1234.56" em cêntimos. */
export function parseAmountToCents(input: string): number {
  const cleaned = (input || "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}
