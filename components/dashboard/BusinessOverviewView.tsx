"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatPriceCents } from "@/lib/checkout";
import { Wallet, TrendingUp, Building2, Loader2, CalendarClock, ChevronRight, X, ExternalLink, Mail, Lock, Search, Send, Handshake, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import PlannerPilotCard from "./PlannerPilotCard";
import type { ModuleId } from "@/lib/modules";

interface PartnerRow {
  id: string;
  name: string;
  events: number;
  active: number;
  revenueCents: number;
  lastPaymentAt: string | null;
}

interface EventRow {
  id: string;
  slug: string;
  groomName: string | null;
  brideName: string | null;
  userEmail: string | null;
  brandId: string;
  createdAt: string | null;
  eventDate: string | null;
  unlockedModules: string[];
  revenueCents: number;
  paymentsCount: number;
  lastPaymentAt: string | null;
}

interface Overview {
  kpis: {
    totalRevenueCents: number;
    monthRevenueCents: number;
    totalEvents: number;
    activeEvents: number;
    totalPartners: number;
    publishedEvents: number;
    eventsThisMonth: number;
    activePartners: number;
  };
  revenueByMonth: { month: string; cents: number; payments: number }[];
  commissions: { toPayCents: number; pendingCents: number; partnersToPay: number; partnersMissingBilling: number };
  todo: { noticesToSend: number; contentToDelete: number };
  partners: PartnerRow[];
  events: EventRow[];
}

interface BusinessOverviewViewProps {
  locale: string;
  moduleNames?: Record<ModuleId, string>;
  onOpenEvent?: (slug: string) => void;
  // Atalhos da lista "Para tratar" para as outras vistas da Administração.
  onGo?: (view: "commissions" | "archived" | "brands") => void;
}

export default function BusinessOverviewView({ locale, moduleNames, onOpenEvent, onGo }: BusinessOverviewViewProps) {
  const en = locale === "en";
  const t = {
    title: en ? "Overview" : "Visão geral",
    subtitle: en ? "The business at a glance: what came in, what is published and what needs your attention." : "O negócio num relance: o que entrou, o que está publicado e o que precisa da vossa atenção.",
    published: en ? "Published" : "Publicados",
    publishedOf: en ? "of {n} events ({p}%)" : "de {n} eventos ({p}%)",
    newThisMonth: en ? "New events this month" : "Eventos novos este mês",
    activePartners: en ? "Active partners" : "Parceiros ativos",
    commissionsToPay: en ? "Commissions to pay" : "Comissões por pagar",
    todoTitle: en ? "To handle" : "Para tratar",
    todoNone: en ? "Nothing to handle right now." : "Nada para tratar neste momento.",
    todoCommissions: en ? "{v} in approved commissions to pay to {n} partner(s)" : "{v} em comissões aprovadas para pagar a {n} parceiro(s)",
    todoBilling: en ? "{n} partner(s) with commissions to pay are missing VAT no. or IBAN" : "{n} parceiro(s) com comissões por pagar sem NIF ou IBAN",
    todoNotices: en ? "{n} archived event(s) without the end-of-period notice" : "{n} evento(s) arquivado(s) sem o aviso de fim de prazo",
    todoPurge: en ? "{n} expired event(s) with content still to delete" : "{n} evento(s) expirado(s) com conteúdo por apagar",
    pendingNote: en ? "+ {v} pending (within the 14 days)" : "+ {v} pendentes (ainda nos 14 dias)",
    go: en ? "Open" : "Abrir",
    byMonth: en ? "Revenue by month" : "Receita por mês",
    month: en ? "Month" : "Mês",
    paymentsCol: en ? "Payments" : "Pagamentos",
    totalRevenue: en ? "Total revenue" : "Receita total",
    monthRevenue: en ? "Revenue this month" : "Receita este mês",
    totalEvents: en ? "Total events" : "Eventos totais",
    activeEvents: en ? "Active accounts" : "Contas ativas",
    totalPartners: en ? "Partners" : "Parceiros",
    partnersTitle: en ? "Revenue by partner" : "Receita por parceiro",
    partnersHint: en ? "Click a partner to see its accounts." : "Clique num parceiro para ver as suas contas.",
    partner: en ? "Partner" : "Parceiro",
    events: en ? "Events" : "Eventos",
    active: en ? "Active" : "Ativos",
    revenue: en ? "Revenue" : "Receita",
    lastPayment: en ? "Last payment" : "Último pagamento",
    never: en ? "never" : "nunca",
    loadError: en ? "Could not load business data." : "Não foi possível carregar os dados de negócio.",
    accountsOf: en ? "Accounts —" : "Contas —",
    close: en ? "Close" : "Fechar",
    account: en ? "Account" : "Conta",
    email: en ? "Email" : "Email",
    registered: en ? "Registered" : "Registado",
    modules: en ? "Modules" : "Módulos",
    purchases: en ? "Purchases" : "Compras",
    open: en ? "Open" : "Abrir",
    noEvents: en ? "No accounts for this partner yet." : "Ainda não há contas para este parceiro.",
    noResults: en ? "No accounts match your search." : "Nenhuma conta corresponde à pesquisa.",
    searchPh: en ? "Search by couple, slug or email..." : "Pesquisar por casal, slug ou email...",
    totalRow: en ? "Total" : "Total",
    noModules: en ? "none" : "nenhum",
  };

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError(t.loadError); setLoading(false); return; }
      try {
        const res = await fetch("/api/admin/business-overview", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || t.loadError); setLoading(false); return; }
        setData(json);
      } catch {
        setError(t.loadError);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDate = (d?: string | null) => {
    if (!d) return t.never;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return t.never;
    return dt.toLocaleDateString(en ? "en-US" : "pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  };

  const selectedPartner = data?.partners.find(p => p.id === selectedPartnerId) || null;
  const selectedEvents = useMemo(() => {
    if (!data || !selectedPartnerId) return [];
    return data.events
      .filter(ev => ev.brandId === selectedPartnerId)
      .sort((a, b) => b.revenueCents - a.revenueCents);
  }, [data, selectedPartnerId]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectedEvents;
    return selectedEvents.filter(ev => {
      const haystack = [ev.groomName, ev.brideName, ev.slug, ev.userEmail].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [selectedEvents, search]);

  const selectPartner = (id: string) => {
    setSelectedPartnerId(prev => (prev === id ? null : id));
    setSearch("");
  };

  const kpiCard = (icon: React.ReactNode, label: string, value: string, note?: string) => (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-brand mb-3">
        <span className="w-8 h-8 rounded-xl bg-brand/5 flex items-center justify-center shrink-0">{icon}</span>
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-tight">{label}</p>
      </div>
      <p className="font-serif text-3xl text-ink whitespace-nowrap">{value}</p>
      {note && <p className="text-[10px] text-gray-400 mt-0.5">{note}</p>}
    </div>
  );

  const todoRow = (icon: React.ReactNode, text: string, view: "commissions" | "archived" | "brands", tone: "brand" | "amber" | "red" = "brand") => (
    <li key={view + text} className="px-6 py-4 flex items-center justify-between gap-4">
      <span className={`flex items-center gap-3 text-sm ${tone === "red" ? "text-red-700" : tone === "amber" ? "text-amber-700" : "text-ink"}`}>{icon} {text}</span>
      {onGo && (
        <button onClick={() => onGo(view)} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand hover:gap-2.5 transition-all shrink-0">
          {t.go} <ChevronRight size={12} />
        </button>
      )}
    </li>
  );
  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const l = new Date(y, m - 1, 1).toLocaleDateString(en ? "en-GB" : "pt-PT", { month: "long", year: "numeric" });
    return l.charAt(0).toUpperCase() + l.slice(1);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
      ) : error ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center text-sm text-red-500">{error}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {kpiCard(<Wallet size={16} />, t.totalRevenue, formatPriceCents(data.kpis.totalRevenueCents, locale))}
            {kpiCard(<TrendingUp size={16} />, t.monthRevenue, formatPriceCents(data.kpis.monthRevenueCents, locale))}
            {kpiCard(<Send size={16} />, t.published, String(data.kpis.publishedEvents), t.publishedOf.replace("{n}", String(data.kpis.totalEvents)).replace("{p}", String(data.kpis.totalEvents ? Math.round((data.kpis.publishedEvents / data.kpis.totalEvents) * 100) : 0)))}
            {kpiCard(<CalendarClock size={16} />, t.newThisMonth, String(data.kpis.eventsThisMonth))}
            {kpiCard(<Building2 size={16} />, t.activePartners, String(data.kpis.activePartners))}
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6 mb-8">
            <section className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-cream/50"><span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.todoTitle}</span></div>
              {(() => {
                const c = data.commissions, d = data.todo;
                const rows = [
                  c.toPayCents > 0 && todoRow(<Handshake size={16} className="text-brand" />, t.todoCommissions.replace("{v}", formatPriceCents(c.toPayCents, locale)).replace("{n}", String(c.partnersToPay)), "commissions"),
                  c.partnersMissingBilling > 0 && todoRow(<AlertTriangle size={16} />, t.todoBilling.replace("{n}", String(c.partnersMissingBilling)), "brands", "amber"),
                  d.noticesToSend > 0 && todoRow(<Mail size={16} className="text-brand" />, t.todoNotices.replace("{n}", String(d.noticesToSend)), "archived"),
                  d.contentToDelete > 0 && todoRow(<Trash2 size={16} />, t.todoPurge.replace("{n}", String(d.contentToDelete)), "archived", "red"),
                ].filter(Boolean);
                return rows.length ? <ul className="divide-y divide-gray-50">{rows}</ul> : (
                  <p className="px-6 py-8 text-sm text-gray-400 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> {t.todoNone}</p>
                );
              })()}
            </section>
            <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Handshake size={11} /> {t.commissionsToPay}</p>
              <p className="font-serif text-4xl text-brand">{formatPriceCents(data.commissions.toPayCents, locale)}</p>
              {data.commissions.pendingCents > 0 && <p className="text-[11px] text-gray-400 mt-1">{t.pendingNote.replace("{v}", formatPriceCents(data.commissions.pendingCents, locale))}</p>}
              {onGo && <button onClick={() => onGo("commissions")} className="mt-4 self-start inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand hover:gap-2.5 transition-all">{t.go} <ChevronRight size={12} /></button>}
            </section>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-100 bg-cream/50"><span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.byMonth}</span></div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-cream/30">
                  <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.month}</th>
                  <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{t.paymentsCol}</th>
                  <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-right">{t.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {[...data.revenueByMonth].reverse().map(r => (
                  <tr key={r.month} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-3 text-sm text-ink">{monthLabel(r.month)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 text-center">{r.payments}</td>
                    <td className="px-6 py-3 text-sm font-serif text-brand text-right">{formatPriceCents(r.cents, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-100 bg-cream/50 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.partnersTitle}</span>
              <span className="text-[10px] text-gray-300">{t.partnersHint}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-cream/30">
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.partner}</th>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{t.events}</th>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{t.active}</th>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-right">{t.revenue}</th>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-right">{t.lastPayment}</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.partners.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => selectPartner(p.id)}
                      className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selectedPartnerId === p.id ? "bg-brand/5" : "hover:bg-cream/40"}`}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-ink">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{p.events}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{p.active}</td>
                      <td className="px-6 py-4 text-sm font-serif text-brand text-right">{formatPriceCents(p.revenueCents, locale)}</td>
                      <td className="px-6 py-4 text-[11px] text-gray-400 text-right whitespace-nowrap">{fmtDate(p.lastPaymentAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight size={14} className={`text-gray-300 transition-transform ${selectedPartnerId === p.id ? "rotate-90" : ""}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedPartner && (
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-cream/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 shrink-0">{t.accountsOf} {selectedPartner.name}</span>
                <div className="flex items-center gap-3">
                  {selectedEvents.length > 0 && (
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t.searchPh}
                        className="pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-full outline-none focus:border-brand w-56 sm:w-64"
                      />
                    </div>
                  )}
                  <button onClick={() => setSelectedPartnerId(null)} className="text-gray-300 hover:text-red-500 transition-colors inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest shrink-0">
                    <X size={13} /> {t.close}
                  </button>
                </div>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">{t.noEvents}</div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">{t.noResults}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[820px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-cream/30">
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.account}</th>
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.email}</th>
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.registered}</th>
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.modules}</th>
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{t.purchases}</th>
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-right">{t.revenue}</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map(ev => (
                        <tr key={ev.id} className="border-b border-gray-50 last:border-0 hover:bg-cream/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-serif text-base text-ink leading-tight">
                              {ev.groomName && ev.brideName ? `${ev.groomName} & ${ev.brideName}` : ev.slug}
                            </p>
                            <p className="text-[10px] text-gray-400">{ev.slug}</p>
                          </td>
                          <td className="px-6 py-4 text-[12px] text-gray-500">
                            <span className="inline-flex items-center gap-1.5"><Mail size={12} className="text-gray-300" /> {ev.userEmail || "—"}</span>
                          </td>
                          <td className="px-6 py-4 text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(ev.createdAt)}</td>
                          <td className="px-6 py-4">
                            {ev.unlockedModules.length === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-gray-300"><Lock size={10} /> {t.noModules}</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {ev.unlockedModules.map(m => (
                                  <span key={m} className="text-[9px] font-bold uppercase tracking-wide bg-brand/5 text-brand px-2 py-0.5 rounded-md">
                                    {moduleNames?.[m as ModuleId] || m}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{ev.paymentsCount}</td>
                          <td className="px-6 py-4 text-sm font-serif text-brand text-right">{formatPriceCents(ev.revenueCents, locale)}</td>
                          <td className="px-6 py-4 text-right">
                            {onOpenEvent && (
                              <button onClick={() => onOpenEvent(ev.slug)} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand hover:gap-2.5 transition-all">
                                {t.open} <ExternalLink size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-cream/30">
                        <td colSpan={5} className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-right">{t.totalRow}</td>
                        <td className="px-6 py-3 text-sm font-serif text-brand text-right">
                          {formatPriceCents(filteredEvents.reduce((s, ev) => s + ev.revenueCents, 0), locale)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
          <div className="mt-8">
            <PlannerPilotCard locale={locale} />
          </div>
        </>
      ) : null}
    </div>
  );
}
