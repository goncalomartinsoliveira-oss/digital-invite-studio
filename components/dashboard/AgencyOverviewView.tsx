"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ExternalLink, ListChecks, Wallet, Loader2, AlertTriangle } from "lucide-react";
import { formatCents, isOverdue, type EventTask, type CostPayment } from "@/lib/planner";

// "O que precisa da minha atenção esta semana, em todos os casamentos" — o
// ecrã que a agência abre de manhã. Junta tarefas vencidas/a vencer e
// pagamentos vencidos/a 30 dias, de TODOS os eventos ativos da marca, num
// só sítio — sem isto, saber o que está pendente obriga a abrir evento a
// evento.

type EventLite = { id: string; slug: string; groom_name: string; bride_name: string };

interface Props {
  events: EventLite[];
  locale: string;
  onOpenEvent: (slug: string) => void;
}

const PAYMENT_WINDOW_DAYS = 30;

export default function AgencyOverviewView({ events, locale, onOpenEvent }: Props) {
  const en = locale === "en";
  const t = {
    title: en ? "This Week" : "Esta Semana",
    subtitle: en
      ? "Tasks and payments across every active event, in one place."
      : "Tarefas e pagamentos de todos os eventos ativos, num só sítio.",
    tasks: en ? "Tasks" : "Tarefas",
    tasksEmpty: en ? "Nothing pending. All caught up." : "Nada pendente. Tudo em dia.",
    payments: en ? "Payments" : "Pagamentos",
    paymentsSubtitle: en ? `Due within ${PAYMENT_WINDOW_DAYS} days, or overdue` : `A vencer nos próximos ${PAYMENT_WINDOW_DAYS} dias, ou já vencidos`,
    paymentsEmpty: en ? "No payments due soon." : "Sem pagamentos a vencer.",
    overdue: en ? "Overdue" : "Vencida",
    today: en ? "Today" : "Hoje",
    inDays: (n: number) => en ? `In ${n}d` : `Em ${n}d`,
    overdueDays: (n: number) => en ? `${n}d overdue` : `${n}d de atraso`,
    noEvents: en ? "No active events yet." : "Ainda não há eventos ativos.",
  };

  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [payments, setPayments] = useState<CostPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const eventIds = events.map(e => e.id);
  const eventName = (invitationId: string) => {
    const ev = events.find(e => e.id === invitationId);
    if (!ev) return "—";
    return ev.groom_name && ev.bride_name ? `${ev.groom_name} & ${ev.bride_name}` : ev.slug;
  };
  const eventSlug = (invitationId: string) => events.find(e => e.id === invitationId)?.slug;

  const load = useCallback(async () => {
    if (eventIds.length === 0) { setLoading(false); return; }
    setLoading(true);
    const [tRes, pRes] = await Promise.all([
      supabase.from("event_tasks").select("*").in("invitation_id", eventIds).neq("status", "done").order("due_date", { nullsFirst: false }),
      supabase.from("event_cost_payments").select("*").in("invitation_id", eventIds).is("paid_at", null).order("due_date"),
    ]);
    setTasks((tRes.data as EventTask[]) || []);
    setPayments((pRes.data as CostPayment[]) || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIds.join(",")]);

  useEffect(() => { load(); }, [load]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const windowEndISO = new Date(Date.now() + PAYMENT_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);

  const relevantTasks = tasks
    .filter(tk => tk.due_date && tk.due_date <= windowEndISO)
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));

  const relevantPayments = payments
    .filter(p => p.due_date && p.due_date <= windowEndISO)
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));

  const daysFrom = (iso: string) => Math.round((new Date(iso).getTime() - new Date(todayISO).getTime()) / 86400000);

  const dueLabel = (iso: string | null) => {
    if (!iso) return "";
    const d = daysFrom(iso);
    if (d < 0) return t.overdueDays(-d);
    if (d === 0) return t.today;
    return t.inDays(d);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 text-sm">{t.noEvents}</div>
      ) : loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Tarefas */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-cream/50 flex items-center gap-2">
              <ListChecks size={14} className="text-brand" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t.tasks}</span>
              {relevantTasks.some(tk => isOverdue(tk)) && (
                <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={10} /> {t.overdue}
                </span>
              )}
            </div>
            {relevantTasks.length === 0 ? (
              <p className="text-sm text-gray-400 p-10 text-center">{t.tasksEmpty}</p>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                {relevantTasks.map(tk => {
                  const late = isOverdue(tk);
                  return (
                    <li key={tk.id}>
                      <button
                        onClick={() => { const s = eventSlug(tk.invitation_id); if (s) onOpenEvent(s); }}
                        className="w-full flex items-center gap-3 px-6 py-3.5 text-left hover:bg-cream/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink truncate">{tk.title}</p>
                          <p className="text-[10px] text-gray-400 truncate">{eventName(tk.invitation_id)}</p>
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${late ? "text-red-600 bg-red-50 border border-red-100" : "text-gray-500 bg-gray-50"}`}>
                          {dueLabel(tk.due_date)}
                        </span>
                        <ExternalLink size={12} className="text-gray-300 shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pagamentos */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-cream/50">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-brand" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t.payments}</span>
                {relevantPayments.some(p => p.due_date && p.due_date < todayISO) && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                    <AlertTriangle size={10} /> {t.overdue}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{t.paymentsSubtitle}</p>
            </div>
            {relevantPayments.length === 0 ? (
              <p className="text-sm text-gray-400 p-10 text-center">{t.paymentsEmpty}</p>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                {relevantPayments.map(p => {
                  const late = !!p.due_date && p.due_date < todayISO;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => { const s = eventSlug(p.invitation_id); if (s) onOpenEvent(s); }}
                        className="w-full flex items-center gap-3 px-6 py-3.5 text-left hover:bg-cream/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink truncate">{p.label || formatCents(p.amount_cents, en ? "en-GB" : "pt-PT")}</p>
                          <p className="text-[10px] text-gray-400 truncate">{eventName(p.invitation_id)}</p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-ink tabular-nums">{formatCents(p.amount_cents, en ? "en-GB" : "pt-PT")}</span>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${late ? "text-red-600 bg-red-50 border border-red-100" : "text-gray-500 bg-gray-50"}`}>
                          {dueLabel(p.due_date)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
