import { budgetTotals, budgetHealth, type BudgetHealth, type CostPayment, type EventCost, type EventTask, type GuestCounts } from "@/lib/planner";

// "Esta semana" (Wedding Planner): o estado de cada casamento numa linha, com
// semáforo, e os sinais vindos dos convidados. Funções puras — sem Supabase —
// para que as regras fiquem num só sítio, explícitas e fáceis de testar.
//
// Regras do semáforo (por ordem de gravidade):
//   VERMELHO — há algo que já falhou: tarefa da agência em atraso, pagamento em
//              atraso, orçamento acima de 100%, ou prazo do RSVP passado com
//              convidados ainda sem resposta.
//   AMARELO  — há algo a pedir atenção em breve: orçamento ≥ 85%, RSVP a fechar
//              (≤ 14 dias) com menos de 80% de respostas, casamento a ≤ 30 dias
//              com menos de 90% de respostas, pedidos de acesso por aprovar,
//              tarefas ou pagamentos a vencer nos próximos 7 dias.
//   VERDE    — nada disto.

export type HealthLevel = "red" | "amber" | "green";

export const SOON_DAYS = 7;                 // "a vencer em breve"
export const RSVP_CLOSING_DAYS = 14;        // RSVP "a fechar"
export const RSVP_CLOSING_MIN_RATE = 0.8;
export const WEDDING_CLOSE_DAYS = 30;       // casamento "próximo"
export const WEDDING_CLOSE_MIN_RATE = 0.9;
export const ACTIVE_PAST_DAYS = 30;         // casamentos já feitos continuam visíveis 30 dias (pagamentos finais)

export type Reason =
  | { code: "tasksOverdue"; n: number }
  | { code: "paymentsOverdue"; n: number; cents: number }
  | { code: "budgetOver"; pct: number }
  | { code: "budgetClose"; pct: number }
  | { code: "rsvpClosed"; pending: number }
  | { code: "rsvpClosing"; days: number; rate: number }
  | { code: "weddingCloseLowRsvp"; days: number; rate: number }
  | { code: "accessRequests"; n: number }
  | { code: "dueSoon"; n: number };

export const REASON_LEVEL: Record<Reason["code"], HealthLevel> = {
  tasksOverdue: "red", paymentsOverdue: "red", budgetOver: "red", rsvpClosed: "red",
  budgetClose: "amber", rsvpClosing: "amber", weddingCloseLowRsvp: "amber", accessRequests: "amber", dueSoon: "amber",
};

export type GuestStats = {
  total: number;        // sem pedidos de acesso
  confirmed: number;
  declined: number;
  pending: number;
  requested: number;    // pedidos de acesso por aprovar
  responseRate: number | null; // (confirmados + recusados) / total; null sem convidados
  confirmedCounts: GuestCounts;
  newResponses24h: number | null; // null se a coluna responded_at ainda não existir (migração 0012)
};

export type EventOverview = {
  id: string;
  slug: string;
  name: string;
  eventDate: string | null;
  daysToWedding: number | null;
  guests: GuestStats;
  rsvpDeadline: string | null;
  rsvpDeadlineDays: number | null;
  tasksOverdue: number;
  paymentsOverdue: number;
  paymentsOverdueCents: number;
  dueSoon: number;
  budgetPct: number | null;
  budgetHealth: BudgetHealth | null;
  linksTotal: number;
  linksUnopened: number;
  health: HealthLevel;
  reasons: Reason[];
};

type GuestRow = { invitation_id: string; status: string; category: string; responded_at?: string | null };
type LinkRow = { invitation_id: string; open_count?: number | null };
type EventRow = {
  id: string; slug: string; groom_name?: string | null; bride_name?: string | null; event_date?: string | null;
  expires_at?: string | null; planner_budget_total_cents?: number | null;
  content?: { content?: { rsvp?: { deadline_date?: string | null } } } | null;
};

const dayMs = 86400000;
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((new Date(toISO.slice(0, 10)).getTime() - new Date(fromISO.slice(0, 10)).getTime()) / dayMs);
}

export function eventName(e: EventRow): string {
  return e.groom_name && e.bride_name ? `${e.groom_name} & ${e.bride_name}` : e.slug;
}

// Casamentos que contam para "Esta semana": não expirados e sem data ou com data
// a partir de há 30 dias (os pagamentos finais vencem muitas vezes depois do dia).
export function isActiveEvent(e: EventRow, today: Date = new Date()): boolean {
  if (e.expires_at && new Date(e.expires_at) < today) return false;
  if (!e.event_date) return true;
  return daysBetween(isoDay(today), e.event_date) >= -ACTIVE_PAST_DAYS;
}

export function guestStats(rows: GuestRow[], today: Date = new Date()): GuestStats {
  const real = rows.filter(g => g.status !== "requested");
  const confirmed = real.filter(g => g.status === "confirmed");
  const declined = real.filter(g => g.status === "declined").length;
  const hasRespondedAt = rows.some(g => "responded_at" in g);
  const since = today.getTime() - dayMs;
  return {
    total: real.length,
    confirmed: confirmed.length,
    declined,
    pending: real.length - confirmed.length - declined,
    requested: rows.length - real.length,
    responseRate: real.length ? (confirmed.length + declined) / real.length : null,
    confirmedCounts: {
      adult: confirmed.filter(g => g.category === "adult").length,
      child: confirmed.filter(g => g.category === "child").length,
      baby: confirmed.filter(g => g.category === "baby").length,
    },
    newResponses24h: hasRespondedAt
      ? real.filter(g => g.responded_at && new Date(g.responded_at).getTime() >= since).length
      : null,
  };
}

export function computeEventOverview(
  e: EventRow,
  data: { tasks: EventTask[]; payments: CostPayment[]; costs: EventCost[]; guests: GuestRow[]; links: LinkRow[] },
  today: Date = new Date()
): EventOverview {
  const todayISO = isoDay(today);
  const soonISO = isoDay(new Date(today.getTime() + SOON_DAYS * dayMs));
  const guests = guestStats(data.guests, today);

  // Tarefas da agência (ou conjuntas) — as do casal vão para "À espera dos noivos".
  const agencyTasks = data.tasks.filter(t => t.status !== "done" && t.responsible !== "couple");
  const tasksOverdue = agencyTasks.filter(t => t.due_date && t.due_date < todayISO).length;
  const unpaid = data.payments.filter(p => !p.paid_at);
  const overduePays = unpaid.filter(p => p.due_date && p.due_date < todayISO);
  const dueSoon =
    agencyTasks.filter(t => t.due_date && t.due_date >= todayISO && t.due_date <= soonISO).length +
    unpaid.filter(p => p.due_date && p.due_date >= todayISO && p.due_date <= soonISO).length;

  const budgetCents = e.planner_budget_total_cents || 0;
  const totals = budgetTotals(data.costs, data.payments, guests.confirmedCounts, today);
  const budgetPct = budgetCents > 0 ? Math.round((totals.gross / budgetCents) * 100) : null;
  const health = budgetCents > 0 ? budgetHealth(totals.gross, budgetCents) : null;

  const deadline = e.content?.content?.rsvp?.deadline_date || null;
  const rsvpDeadlineDays = deadline ? daysBetween(todayISO, deadline) : null;
  const daysToWedding = e.event_date ? daysBetween(todayISO, e.event_date) : null;

  const reasons: Reason[] = [];
  if (tasksOverdue) reasons.push({ code: "tasksOverdue", n: tasksOverdue });
  if (overduePays.length) reasons.push({ code: "paymentsOverdue", n: overduePays.length, cents: overduePays.reduce((s, p) => s + (p.amount_cents || 0), 0) });
  if (health === "over" && budgetPct !== null) reasons.push({ code: "budgetOver", pct: budgetPct });
  if (rsvpDeadlineDays !== null && rsvpDeadlineDays < 0 && guests.pending > 0) reasons.push({ code: "rsvpClosed", pending: guests.pending });
  if (health === "close" && budgetPct !== null) reasons.push({ code: "budgetClose", pct: budgetPct });
  if (rsvpDeadlineDays !== null && rsvpDeadlineDays >= 0 && rsvpDeadlineDays <= RSVP_CLOSING_DAYS && guests.responseRate !== null && guests.responseRate < RSVP_CLOSING_MIN_RATE) {
    reasons.push({ code: "rsvpClosing", days: rsvpDeadlineDays, rate: guests.responseRate });
  } else if (daysToWedding !== null && daysToWedding >= 0 && daysToWedding <= WEDDING_CLOSE_DAYS && guests.responseRate !== null && guests.responseRate < WEDDING_CLOSE_MIN_RATE) {
    reasons.push({ code: "weddingCloseLowRsvp", days: daysToWedding, rate: guests.responseRate });
  }
  if (guests.requested) reasons.push({ code: "accessRequests", n: guests.requested });
  if (dueSoon) reasons.push({ code: "dueSoon", n: dueSoon });

  const level: HealthLevel = reasons.some(r => REASON_LEVEL[r.code] === "red") ? "red"
    : reasons.length ? "amber" : "green";

  return {
    id: e.id, slug: e.slug, name: eventName(e), eventDate: e.event_date || null, daysToWedding,
    guests, rsvpDeadline: deadline, rsvpDeadlineDays,
    tasksOverdue, paymentsOverdue: overduePays.length, paymentsOverdueCents: overduePays.reduce((s, p) => s + (p.amount_cents || 0), 0),
    dueSoon, budgetPct, budgetHealth: health,
    linksTotal: data.links.length, linksUnopened: data.links.filter(l => !l.open_count).length,
    health: level, reasons,
  };
}

const LEVEL_ORDER: Record<HealthLevel, number> = { red: 0, amber: 1, green: 2 };

// Vermelhos primeiro, depois amarelos, depois verdes; dentro de cada cor, o
// casamento mais próximo primeiro (sem data no fim).
export function sortOverviews(list: EventOverview[]): EventOverview[] {
  return list.slice().sort((a, b) =>
    LEVEL_ORDER[a.health] - LEVEL_ORDER[b.health] ||
    (a.daysToWedding ?? 1e9) - (b.daysToWedding ?? 1e9)
  );
}

// Sinais dos convidados — o que só a DIS sabe, porque o RSVP vive aqui.
export type GuestSignal =
  | { code: "rsvpClosing"; eventId: string; days: number; pending: number; rate: number }
  | { code: "rsvpClosed"; eventId: string; pending: number }
  | { code: "newResponses"; eventId: string; n: number }
  | { code: "linksUnopened"; eventId: string; n: number; total: number }
  | { code: "accessRequests"; eventId: string; n: number };

export function guestSignals(list: EventOverview[]): GuestSignal[] {
  const out: GuestSignal[] = [];
  for (const o of list) {
    const g = o.guests;
    if (o.rsvpDeadlineDays !== null && o.rsvpDeadlineDays < 0 && g.pending > 0) out.push({ code: "rsvpClosed", eventId: o.id, pending: g.pending });
    else if (o.rsvpDeadlineDays !== null && o.rsvpDeadlineDays <= 21 && g.pending > 0) out.push({ code: "rsvpClosing", eventId: o.id, days: o.rsvpDeadlineDays, pending: g.pending, rate: g.responseRate ?? 0 });
    if (g.requested) out.push({ code: "accessRequests", eventId: o.id, n: g.requested });
    if (g.newResponses24h) out.push({ code: "newResponses", eventId: o.id, n: g.newResponses24h });
    // Só depois de os links terem tido tempo de circular: pelo menos um grupo já abriu.
    if (o.linksTotal && o.linksUnopened && o.linksUnopened < o.linksTotal) out.push({ code: "linksUnopened", eventId: o.id, n: o.linksUnopened, total: o.linksTotal });
  }
  const weight: Record<GuestSignal["code"], number> = { rsvpClosed: 0, rsvpClosing: 1, accessRequests: 2, linksUnopened: 3, newResponses: 4 };
  return out.sort((a, b) => weight[a.code] - weight[b.code]);
}
