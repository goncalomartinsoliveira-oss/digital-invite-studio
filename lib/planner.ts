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
  /** @deprecated O orçamento passou a ser um total por evento (ver 0008_budget_total.sql). A coluna ficou na BD para não perder o histórico, mas já não é lida nem escrita. */
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

// Documento/contrato por evento — `cost_id` nulo é um documento geral do
// evento (ex.: contrato do espaço, que cobre várias linhas); preenchido é um
// documento específico dessa relação com esse fornecedor.
export type EventDocument = {
  id: string;
  invitation_id: string;
  cost_id: string | null;
  name: string;
  file_url: string;
  visibility: PlannerVisibility;
  uploaded_by_email: string | null;
  created_at: string;
};

// Ficha completa do fornecedor no diretório da agência — reutilizada em
// todos os eventos da marca. `agency_vendors` já tinha estes campos desde a
// Fase 0, mas sem nenhuma interface a preenchê-los além do nome (criado ao
// escrever numa linha de custo) — é isso que a área de Fornecedores resolve.
export type AgencyVendor = {
  id: string;
  brand_id: string;
  name: string;
  category: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  rating: number | null;
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
 *
 * O valor orçamentado não vem daqui: desde 0008_budget_total.sql é um único
 * número por evento (`invitations.planner_budget_total_cents`), não a soma
 * das linhas.
 */
export function budgetTotals(
  costs: EventCost[],
  payments: CostPayment[],
  confirmedGuests: number,
  today: Date = new Date()
): BudgetTotals {
  const todayISO = today.toISOString().slice(0, 10);
  const totals: BudgetTotals = { net: 0, gross: 0, paid: 0, outstanding: 0, overdue: 0 };

  for (const c of costs) {
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

// ── Leitura do orçamento (gráficos) ──────────────────────────────────────────

export type CostGroup = { key: string; label: string; cents: number };

/**
 * Agrupa os custos por uma dimensão (fornecedor, categoria) e devolve-os
 * ordenados do maior para o menor — a ordem que um gráfico de barras precisa.
 *
 * `maxSlices` dobra a cauda numa fatia "Outros" em vez de desenhar 20 barras
 * de 1% cada. A fatia diz quantas linhas absorveu, para nunca parecer que o
 * gráfico mostra tudo quando não mostra.
 */
export function groupCosts(
  costs: EventCost[],
  confirmedGuests: number,
  keyOf: (cost: EventCost) => { key: string; label: string },
  maxSlices = 8,
  otherLabel = "Outros"
): CostGroup[] {
  const byKey = new Map<string, CostGroup>();
  for (const cost of costs) {
    // Uma linha cancelada não é dinheiro comprometido — não conta.
    if (cost.status === "cancelado") continue;
    const cents = costGrossCents(cost, confirmedGuests);
    if (cents <= 0) continue;
    const { key, label } = keyOf(cost);
    const existing = byKey.get(key);
    if (existing) existing.cents += cents;
    else byKey.set(key, { key, label, cents });
  }

  const sorted = [...byKey.values()].sort((a, b) => b.cents - a.cents);
  if (sorted.length <= maxSlices) return sorted;

  const head = sorted.slice(0, maxSlices - 1);
  const tail = sorted.slice(maxSlices - 1);
  head.push({
    key: "__other__",
    label: `${otherLabel} (${tail.length})`,
    cents: tail.reduce((sum, g) => sum + g.cents, 0),
  });
  return head;
}

export type BudgetHealth = "under" | "close" | "over";

/**
 * Estado do orçamento face ao contratado. "close" a partir dos 85% é um aviso
 * deliberadamente cedo: quando um casamento chega aos 100% já não há margem
 * para o imprevisto que aparece sempre.
 */
export function budgetHealth(grossCents: number, budgetCents: number): BudgetHealth {
  if (budgetCents <= 0) return "under";
  const pct = (grossCents / budgetCents) * 100;
  if (pct > 100) return "over";
  if (pct >= 85) return "close";
  return "under";
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

// ── Cronograma do dia ────────────────────────────────────────────────────────
// Ao contrário do resto do módulo, nasce partilhado com o casal por omissão —
// é o horário do próprio dia deles, não informação interna da agência.

export type TimelineBlock = {
  id: string;
  invitation_id: string;
  event_time: string; // "HH:MM:SS", devolvido assim pelo Postgres (tipo `time`)
  duration_minutes: number | null;
  title: string;
  notes: string | null;
  vendor_id: string | null;
  visibility: PlannerVisibility;
  sort_order: number;
};

/** "14:30:00" → "14:30", para inputs `type="time"` e para mostrar. */
export function formatEventTime(time: string): string {
  return (time || "").slice(0, 5);
}

/** Hora de fim de um bloco, a partir da hora de início + duração. */
export function timelineBlockEndTime(block: Pick<TimelineBlock, "event_time" | "duration_minutes">): string | null {
  if (!block.duration_minutes) return null;
  const [h, m] = formatEventTime(block.event_time).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const end = new Date(2000, 0, 1, h, m + block.duration_minutes);
  return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
}

// ── Portal do fornecedor ─────────────────────────────────────────────────────
// Link de leitura, sem conta DIS, por evento — não por fornecedor: uma página
// central (SharingModule) lista os "tipos" de link disponíveis, a agência ou
// o casal gera o que fizer sentido e envia a quem quiser (um fotógrafo e um
// DJ podem perfeitamente receber o mesmo link "Cronograma"). Por isso é
// reutilizável por vários fornecedores, e revogar afeta todos os que o
// receberam de uma vez — decisão consciente, trocada por simplicidade em vez
// de um link individual por fornecedor.
//
// Ver 0005_vendor_portal.sql para o porquê de não ter política de leitura
// pública: a página pública lê esta tabela do servidor, com a service_role
// key, nunca com a anon key do browser.

export type VendorPortalKind = "timeline" | "full";

export const VENDOR_PORTAL_KINDS: VendorPortalKind[] = ["timeline", "full"];

export const VENDOR_PORTAL_KIND_LABELS: Record<VendorPortalKind, { pt: string; en: string }> = {
  timeline: { pt: "Só Cronograma", en: "Timeline only" },
  full: { pt: "Informação completa", en: "Full information" },
};

// "Completa" fica deliberadamente limitada a informação logística — nunca
// inclui orçamento/preços, mesmo neste link mais aberto (ver conversa antes
// de construir: um fornecedor a ver o que a agência cobra a outros
// fornecedores pode prejudicar comercialmente a própria agência).
export const VENDOR_PORTAL_KIND_DESCRIPTIONS: Record<VendorPortalKind, { pt: string; en: string }> = {
  timeline: { pt: "Só o horário do dia — ideal para fotografia, música, decoração.", en: "Just the day's schedule — ideal for photography, music, decor." },
  full: { pt: "Cronograma + confirmados + alergias — ideal para catering.", en: "Timeline + confirmed guests + dietary summary — ideal for catering." },
};

export type VendorPortalLink = {
  id: string;
  invitation_id: string;
  kind: VendorPortalKind;
  token: string;
  expires_at: string;
  created_by_email: string | null;
  created_at: string;
};

/** Token de 192 bits — só é chamado no browser (botão "Gerar link"), nunca no servidor. */
export function generatePortalToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Expira 7 dias depois do casamento — tempo suficiente para o dia-de e um
 * possível ajuste de última hora, sem o link continuar válido meses depois.
 * Se o casamento já passou (ou não há data), dá 7 dias a partir de agora, em
 * vez de gerar um link já nascido expirado.
 */
export function portalLinkExpiry(eventDate: string | null | undefined, now: Date = new Date()): string {
  const nowPlus7 = new Date(now);
  nowPlus7.setDate(nowPlus7.getDate() + 7);
  if (!eventDate) return nowPlus7.toISOString();
  const eventPlus7 = new Date(eventDate);
  eventPlus7.setDate(eventPlus7.getDate() + 7);
  return (eventPlus7 > now ? eventPlus7 : nowPlus7).toISOString();
}

export function isPortalLinkExpired(link: Pick<VendorPortalLink, "expires_at">, now: Date = new Date()): boolean {
  return new Date(link.expires_at).getTime() < now.getTime();
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
