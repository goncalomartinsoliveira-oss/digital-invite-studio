"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ListChecks, Wallet, Loader2, AlertTriangle, Flag, Check, Heart, Users, Hourglass, ChevronRight, Undo2 } from "lucide-react";
import { formatCents, TASK_PRIORITY_WEIGHT, type EventTask, type CostPayment, type EventCost } from "@/lib/planner";
import {
  computeEventOverview, guestSignals, isActiveEvent, sortOverviews, isoDay, daysBetween,
  type EventOverview, type GuestSignal, type HealthLevel, type Reason,
} from "@/lib/plannerOverview";

// "Esta semana" (menu Wedding Planner da lista de eventos) — o ecrã que a
// agência abre de manhã. Quatro partes:
//   1. Os casamentos, um por linha, com semáforo (regras em lib/plannerOverview.ts).
//   2. Tarefas e pagamentos de todos os casamentos, com ação direta (feito/pago,
//      com "anular") e ligação ao separador certo do evento.
//   3. Sinais dos convidados — RSVP a fechar, respostas novas, links por abrir,
//      pedidos de acesso. É o que só a DIS sabe, porque o RSVP vive aqui.
//   4. À espera dos noivos — tarefas cujo responsável é o casal.

type EventRow = { id: string; slug: string; groom_name?: string | null; bride_name?: string | null; event_date?: string | null; [k: string]: any };
export type EventTab = "tasks" | "budget" | "guests";

interface Props {
  events: EventRow[];
  locale: string;
  onOpenEvent: (slug: string, tab?: EventTab) => void;
}

const PRIORITY_COLOR: Record<string, string> = { baixa: "text-gray-300", normal: "text-gold-soft", alta: "text-red-500" };
const DOT: Record<HealthLevel, string> = { red: "bg-red-500", amber: "bg-amber-400", green: "bg-emerald-500" };
const PAYMENT_WINDOW_DAYS = 30;
const COUPLE_WINDOW_DAYS = 14;

// `.in()` com centenas de ids passa o limite de tamanho de um URL — divide em lotes.
async function selectIn<T>(table: string, ids: string[], build?: (q: any) => any): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 80) {
    let q = supabase.from(table).select("*").in("invitation_id", ids.slice(i, i + 80));
    if (build) q = build(q);
    const { data } = await q;
    if (data) out.push(...(data as T[]));
  }
  return out;
}

export default function AgencyOverviewView({ events, locale, onOpenEvent }: Props) {
  const en = locale === "en";
  const money = (c: number) => formatCents(c, en ? "en-GB" : "pt-PT");
  const pct = (r: number) => `${Math.round(r * 100)}%`;
  const t = {
    title: en ? "This week" : "Esta semana",
    subtitle: en ? "Every wedding at a glance: what is late, what is coming and what the guests are doing." : "Todos os casamentos num relance: o que está atrasado, o que aí vem e o que os convidados estão a fazer.",
    weddings: en ? "Your weddings" : "Os vossos casamentos",
    weddingsHint: en ? "Red: something is already late · Amber: needs attention soon · Green: on track" : "Vermelho: algo já falhou · Amarelo: pede atenção em breve · Verde: em dia",
    noEvents: en ? "No active events yet." : "Ainda não há eventos ativos.",
    tasks: en ? "Agency tasks" : "Tarefas da agência",
    tasksEmpty: en ? "Nothing pending. All caught up." : "Nada pendente. Tudo em dia.",
    payments: en ? "Payments to vendors" : "Pagamentos a fornecedores",
    paymentsSubtitle: en ? `Due within ${PAYMENT_WINDOW_DAYS} days, or overdue` : `A vencer nos próximos ${PAYMENT_WINDOW_DAYS} dias, ou já vencidos`,
    paymentsEmpty: en ? "No payments due soon." : "Sem pagamentos a vencer.",
    signals: en ? "Guest signals" : "Sinais dos convidados",
    signalsSubtitle: en ? "From the RSVP — only possible because the guest list lives here" : "Vindos do RSVP — só possível porque a lista de convidados vive aqui",
    signalsEmpty: en ? "Nothing new from the guests." : "Nada de novo dos convidados.",
    couple: en ? "Waiting on the couple" : "À espera dos noivos",
    coupleSubtitle: en ? `Couple's tasks overdue or due within ${COUPLE_WINDOW_DAYS} days` : `Tarefas dos noivos em atraso ou a vencer em ${COUPLE_WINDOW_DAYS} dias`,
    coupleEmpty: en ? "The couples are up to date." : "Os noivos estão em dia.",
    overdue: en ? "Overdue" : "Em atraso",
    today: en ? "Today" : "Hoje",
    inDays: (n: number) => en ? `In ${n}d` : `Em ${n}d`,
    overdueDays: (n: number) => en ? `${n}d overdue` : `${n}d de atraso`,
    noDueDate: en ? "No due date" : "Sem prazo",
    window30: en ? "Next 30 days" : "Próximos 30 dias",
    windowAll: en ? "All" : "Todas",
    markDone: en ? "Mark as done" : "Marcar como feita",
    markPaid: en ? "Mark as paid" : "Marcar como pago",
    paid: en ? "Paid" : "Pago",
    doneMsg: en ? "Task marked as done." : "Tarefa marcada como feita.",
    paidMsg: en ? "Payment marked as paid." : "Pagamento marcado como pago.",
    undo: en ? "Undo" : "Anular",
    saveError: en ? "Could not save. Please try again." : "Não foi possível guardar. Tentem outra vez.",
    noDate: en ? "No date" : "Sem data",
    daysTo: (n: number) => n === 0 ? (en ? "Today!" : "É hoje!") : n > 0 ? (en ? `in ${n} days` : `faltam ${n} dias`) : (en ? `${-n} days ago` : `há ${-n} dias`),
    rsvp: "RSVP",
    conf: en ? "conf." : "conf.",
    noGuests: en ? "no guests" : "sem convidados",
    budget: en ? "Budget" : "Orçamento",
    noBudget: en ? "no budget" : "sem orçamento",
    onTrack: en ? "On track" : "Em dia",
    open: en ? "Open" : "Abrir",
  };

  const reasonText = (r: Reason): string => {
    switch (r.code) {
      case "tasksOverdue": return en ? `${r.n} overdue task${r.n > 1 ? "s" : ""}` : `${r.n} tarefa${r.n > 1 ? "s" : ""} em atraso`;
      case "paymentsOverdue": return en ? `${r.n} overdue payment${r.n > 1 ? "s" : ""} (${money(r.cents)})` : `${r.n} pagamento${r.n > 1 ? "s" : ""} em atraso (${money(r.cents)})`;
      case "budgetOver": return en ? `Budget at ${r.pct}%` : `Orçamento a ${r.pct}%`;
      case "budgetClose": return en ? `Budget at ${r.pct}%` : `Orçamento a ${r.pct}%`;
      case "rsvpClosed": return en ? `RSVP closed · ${r.pending} without answer` : `RSVP fechado · ${r.pending} sem resposta`;
      case "rsvpClosing": return en ? `RSVP closes in ${r.days}d · ${pct(r.rate)} answered` : `RSVP fecha em ${r.days}d · ${pct(r.rate)} responderam`;
      case "weddingCloseLowRsvp": return en ? `Wedding in ${r.days}d · ${pct(r.rate)} answered` : `Casamento em ${r.days}d · ${pct(r.rate)} responderam`;
      case "accessRequests": return en ? `${r.n} access request${r.n > 1 ? "s" : ""}` : `${r.n} pedido${r.n > 1 ? "s" : ""} de acesso`;
      case "dueSoon": return en ? `${r.n} due within 7 days` : `${r.n} a vencer em 7 dias`;
    }
  };

  const signalText = (s: GuestSignal): string => {
    switch (s.code) {
      case "rsvpClosed": return en ? `RSVP deadline passed — ${s.pending} guest${s.pending > 1 ? "s" : ""} still without an answer` : `Prazo do RSVP passou — ${s.pending} convidado${s.pending > 1 ? "s" : ""} ainda sem resposta`;
      case "rsvpClosing": return s.days === 0
        ? (en ? `RSVP closes today — ${s.pending} still pending` : `O RSVP fecha hoje — ${s.pending} ainda por responder`)
        : (en ? `RSVP closes in ${s.days} days — ${s.pending} pending (${pct(s.rate)} answered)` : `O RSVP fecha em ${s.days} dias — ${s.pending} por responder (${pct(s.rate)} já responderam)`);
      case "newResponses": return en ? `${s.n} new answer${s.n > 1 ? "s" : ""} in the last 24 hours` : `${s.n} resposta${s.n > 1 ? "s" : ""} nova${s.n > 1 ? "s" : ""} nas últimas 24 horas`;
      case "linksUnopened": return en ? `${s.n} of ${s.total} groups haven't opened their personal link` : `${s.n} de ${s.total} grupos ainda não abriram o link pessoal`;
      case "accessRequests": return en ? `${s.n} access request${s.n > 1 ? "s" : ""} waiting for approval` : `${s.n} pedido${s.n > 1 ? "s" : ""} de acesso por aprovar`;
    }
  };

  const active = useMemo(() => events.filter(e => isActiveEvent(e)), [events]);
  const ids = active.map(e => e.id);

  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [payments, setPayments] = useState<CostPayment[]>([]);
  const [costs, setCosts] = useState<EventCost[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewWindow, setViewWindow] = useState<"30d" | "all">("30d");
  const [toast, setToast] = useState<{ msg: string; undo?: () => void; error?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (ids.length === 0) { setLoading(false); return; }
    setLoading(true);
    const [tk, py, cs, gs, lk] = await Promise.all([
      selectIn<EventTask>("event_tasks", ids, q => q.neq("status", "done")),
      selectIn<CostPayment>("event_cost_payments", ids, q => q.is("paid_at", null)),
      selectIn<EventCost>("event_costs", ids),
      selectIn<any>("guests", ids),
      selectIn<any>("guest_links", ids),
    ]);
    setTasks(tk); setPayments(py); setCosts(cs); setGuests(gs); setLinks(lk);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const showToast = (msg: string, undo?: () => void, error = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, undo, error });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  const today = new Date();
  const todayISO = isoDay(today);
  const windowEndISO = isoDay(new Date(Date.now() + PAYMENT_WINDOW_DAYS * 86400000));
  const coupleEndISO = isoDay(new Date(Date.now() + COUPLE_WINDOW_DAYS * 86400000));

  const overviews = useMemo(() => sortOverviews(active.map(e => computeEventOverview(e as any, {
    tasks: tasks.filter(x => x.invitation_id === e.id),
    payments: payments.filter(x => x.invitation_id === e.id),
    costs: costs.filter(x => x.invitation_id === e.id),
    guests: guests.filter(x => x.invitation_id === e.id),
    links: links.filter(x => x.invitation_id === e.id),
  }, today))), [active, tasks, payments, costs, guests, links]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = useMemo(() => new Map(overviews.map(o => [o.id, o])), [overviews]);
  const signals = useMemo(() => guestSignals(overviews), [overviews]);

  const sortByDue = (a: { due_date: string | null }, b: { due_date: string | null }) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  };
  const inWindow = (d: string | null) => viewWindow === "all" || (!!d && d <= windowEndISO);

  const agencyTasks = tasks
    .filter(tk => tk.responsible !== "couple" && inWindow(tk.due_date))
    .sort((a, b) => sortByDue(a, b) || (TASK_PRIORITY_WEIGHT[b.priority] - TASK_PRIORITY_WEIGHT[a.priority]));
  const coupleTasks = tasks
    .filter(tk => tk.responsible === "couple" && tk.due_date && tk.due_date <= coupleEndISO)
    .sort(sortByDue);
  const duePayments = payments.filter(p => inWindow(p.due_date)).sort(sortByDue);

  const dueLabel = (iso: string | null) => {
    if (!iso) return t.noDueDate;
    const d = daysBetween(todayISO, iso);
    if (d < 0) return t.overdueDays(-d);
    if (d === 0) return t.today;
    return t.inDays(d);
  };
  const nameOf = (invitationId: string) => byId.get(invitationId)?.name ?? "—";
  const slugOf = (invitationId: string) => byId.get(invitationId)?.slug;
  const open = (invitationId: string, tab?: EventTab) => { const s = slugOf(invitationId); if (s) onOpenEvent(s, tab); };

  // Ação direta com "anular": a linha sai logo da lista (é o que o planner quer
  // ver), e o toast deixa repor durante 6 segundos se foi engano.
  const completeTask = async (task: EventTask) => {
    setTasks(prev => prev.filter(x => x.id !== task.id));
    const { error } = await supabase.from("event_tasks").update({ status: "done" }).eq("id", task.id);
    if (error) { setTasks(prev => [...prev, task]); showToast(t.saveError, undefined, true); return; }
    showToast(t.doneMsg, async () => {
      setToast(null);
      const { error: e2 } = await supabase.from("event_tasks").update({ status: task.status }).eq("id", task.id);
      if (!e2) setTasks(prev => [...prev, task]); else showToast(t.saveError, undefined, true);
    });
  };

  const markPaid = async (p: CostPayment) => {
    setPayments(prev => prev.filter(x => x.id !== p.id));
    const { error } = await supabase.from("event_cost_payments").update({ paid_at: todayISO }).eq("id", p.id);
    if (error) { setPayments(prev => [...prev, p]); showToast(t.saveError, undefined, true); return; }
    showToast(t.paidMsg, async () => {
      setToast(null);
      const { error: e2 } = await supabase.from("event_cost_payments").update({ paid_at: null }).eq("id", p.id);
      if (!e2) setPayments(prev => [...prev, p]); else showToast(t.saveError, undefined, true);
    });
  };

  const card = "bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden";
  const head = "px-6 py-4 border-b border-gray-100 bg-cream/50";
  const headTitle = "text-[10px] font-bold uppercase tracking-widest text-gray-500";
  const pill = (late: boolean) => `shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${late ? "text-red-600 bg-red-50 border border-red-100" : "text-gray-500 bg-gray-50"}`;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
          <p className="text-gray-500 text-sm max-w-2xl">{t.subtitle}</p>
        </div>
        {active.length > 0 && (
          <div className="flex items-center gap-1 bg-cream rounded-full p-1 border border-gold-soft/50 shrink-0">
            {(["30d", "all"] as const).map(w => (
              <button key={w} onClick={() => setViewWindow(w)} className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${viewWindow === w ? "bg-brand text-white" : "text-gray-400 hover:text-brand"}`}>
                {w === "30d" ? t.window30 : t.windowAll}
              </button>
            ))}
          </div>
        )}
      </div>

      {active.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 text-sm">{t.noEvents}</div>
      ) : loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
      ) : (
        <div className="space-y-6">

          {/* 1. Casamentos */}
          <section data-portfolio className={card}>
            <div className={head}>
              <div className="flex items-center gap-2"><Heart size={14} className="text-brand" /><span className={headTitle}>{t.weddings}</span></div>
              <p className="text-[10px] text-gray-400 mt-1">{t.weddingsHint}</p>
            </div>
            <ul className="divide-y divide-gray-50">
              {overviews.map(o => (
                <li key={o.id} data-event={o.slug} data-health={o.health}>
                  <button onClick={() => onOpenEvent(o.slug)} className="w-full text-left px-6 py-4 hover:bg-cream/40 transition-colors flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-3 md:w-64 shrink-0 min-w-0">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${DOT[o.health]}`} aria-label={o.health} />
                      <div className="min-w-0">
                        <p className="font-serif text-lg text-ink leading-tight truncate">{o.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {o.eventDate ? new Date(o.eventDate).toLocaleDateString(en ? "en-GB" : "pt-PT", { day: "2-digit", month: "short", year: "numeric" }) : t.noDate}
                          {o.daysToWedding !== null && ` · ${t.daysTo(o.daysToWedding)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:w-72 shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">
                        {t.rsvp} {o.guests.responseRate === null ? `· ${t.noGuests}` : `${pct(o.guests.responseRate)} · ${o.guests.confirmed} ${t.conf} / ${o.guests.total}`}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${o.budgetHealth === "over" ? "bg-red-50 text-red-600" : o.budgetHealth === "close" ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-600"}`}>
                        {t.budget} {o.budgetPct === null ? `· ${t.noBudget}` : `${o.budgetPct}%`}
                      </span>
                    </div>
                    <p className={`flex-1 min-w-0 text-[12px] ${o.health === "red" ? "text-red-600" : o.health === "amber" ? "text-amber-700" : "text-emerald-700"}`}>
                      {o.reasons.length ? o.reasons.map(reasonText).join(" · ") : t.onTrack}
                    </p>
                    <ChevronRight size={14} className="hidden md:block text-gray-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* 2. Tarefas e pagamentos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section data-tasks className={card}>
              <div className={`${head} flex items-center gap-2`}>
                <ListChecks size={14} className="text-brand" /><span className={headTitle}>{t.tasks}</span>
                {agencyTasks.some(tk => tk.due_date && tk.due_date < todayISO) && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full"><AlertTriangle size={10} /> {t.overdue}</span>
                )}
              </div>
              {agencyTasks.length === 0 ? <p className="text-sm text-gray-400 p-10 text-center">{t.tasksEmpty}</p> : (
                <ul className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                  {agencyTasks.map(tk => {
                    const late = !!tk.due_date && tk.due_date < todayISO;
                    return (
                      <li key={tk.id} data-task={tk.id} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                        <button onClick={() => completeTask(tk)} aria-label={t.markDone} title={t.markDone} className="w-6 h-6 rounded-full border border-gray-300 hover:border-brand hover:bg-brand hover:text-white text-transparent flex items-center justify-center shrink-0 transition-all">
                          <Check size={13} />
                        </button>
                        <button onClick={() => open(tk.invitation_id, "tasks")} className="min-w-0 flex-1 flex items-center gap-3 text-left group">
                          <Flag size={12} className={`shrink-0 ${PRIORITY_COLOR[tk.priority]}`} fill={tk.priority === "alta" ? "currentColor" : "none"} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-ink truncate group-hover:text-brand">{tk.title}</span>
                            <span className="block text-[10px] text-gray-400 truncate">{nameOf(tk.invitation_id)}</span>
                          </span>
                          <span className={pill(late)}>{dueLabel(tk.due_date)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section data-payments className={card}>
              <div className={head}>
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-brand" /><span className={headTitle}>{t.payments}</span>
                  {duePayments.some(p => p.due_date && p.due_date < todayISO) && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full"><AlertTriangle size={10} /> {t.overdue}</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{t.paymentsSubtitle}</p>
              </div>
              {duePayments.length === 0 ? <p className="text-sm text-gray-400 p-10 text-center">{t.paymentsEmpty}</p> : (
                <ul className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                  {duePayments.map(p => {
                    const late = !!p.due_date && p.due_date < todayISO;
                    return (
                      <li key={p.id} data-payment={p.id} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                        <button onClick={() => open(p.invitation_id, "budget")} className="min-w-0 flex-1 flex items-center gap-3 text-left group">
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-ink truncate group-hover:text-brand">{p.label || money(p.amount_cents)}</span>
                            <span className="block text-[10px] text-gray-400 truncate">{nameOf(p.invitation_id)}</span>
                          </span>
                          <span className="shrink-0 text-sm font-bold text-ink tabular-nums">{money(p.amount_cents)}</span>
                          <span className={pill(late)}>{dueLabel(p.due_date)}</span>
                        </button>
                        <button onClick={() => markPaid(p)} title={t.markPaid} aria-label={t.markPaid} className="shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200 hover:border-brand hover:bg-brand hover:text-white rounded-full px-2.5 py-1.5 transition-all">
                          <Check size={11} /> <span className="hidden sm:inline">{t.paid}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* 3. Sinais dos convidados + 4. À espera dos noivos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section data-signals className={card}>
              <div className={head}>
                <div className="flex items-center gap-2"><Users size={14} className="text-brand" /><span className={headTitle}>{t.signals}</span></div>
                <p className="text-[10px] text-gray-400 mt-1">{t.signalsSubtitle}</p>
              </div>
              {signals.length === 0 ? <p className="text-sm text-gray-400 p-10 text-center">{t.signalsEmpty}</p> : (
                <ul className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                  {signals.map((s, i) => (
                    <li key={`${s.code}-${s.eventId}-${i}`} data-signal={s.code}>
                      <button onClick={() => open(s.eventId, "guests")} className="w-full flex items-center gap-3 px-6 py-3.5 text-left hover:bg-cream/40 transition-colors">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.code === "rsvpClosed" ? "bg-red-500" : s.code === "newResponses" ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-ink">{signalText(s)}</span>
                          <span className="block text-[10px] text-gray-400 truncate">{nameOf(s.eventId)}</span>
                        </span>
                        <ChevronRight size={14} className="text-gray-300 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section data-couple className={card}>
              <div className={head}>
                <div className="flex items-center gap-2"><Hourglass size={14} className="text-brand" /><span className={headTitle}>{t.couple}</span></div>
                <p className="text-[10px] text-gray-400 mt-1">{t.coupleSubtitle}</p>
              </div>
              {coupleTasks.length === 0 ? <p className="text-sm text-gray-400 p-10 text-center">{t.coupleEmpty}</p> : (
                <ul className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                  {coupleTasks.map(tk => {
                    const late = !!tk.due_date && tk.due_date < todayISO;
                    return (
                      <li key={tk.id} data-couple-task={tk.id}>
                        <button onClick={() => open(tk.invitation_id, "tasks")} className="w-full flex items-center gap-3 px-6 py-3.5 text-left hover:bg-cream/40 transition-colors">
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-ink truncate">{tk.title}</span>
                            <span className="block text-[10px] text-gray-400 truncate">{nameOf(tk.invitation_id)}</span>
                          </span>
                          <span className={pill(late)}>{dueLabel(tk.due_date)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-full shadow-xl text-sm ${toast.error ? "bg-red-600 text-white" : "bg-ink text-white"}`}>
          <span>{toast.msg}</span>
          {toast.undo && (
            <button onClick={toast.undo} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold-soft hover:text-white">
              <Undo2 size={12} /> {t.undo}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
