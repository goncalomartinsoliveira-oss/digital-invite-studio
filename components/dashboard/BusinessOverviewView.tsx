"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatPriceCents } from "@/lib/checkout";
import { Wallet, TrendingUp, Users, Building2, Loader2, CalendarClock } from "lucide-react";

interface PartnerRow {
  id: string;
  name: string;
  events: number;
  active: number;
  revenueCents: number;
  lastPaymentAt: string | null;
}

interface Overview {
  kpis: {
    totalRevenueCents: number;
    monthRevenueCents: number;
    totalEvents: number;
    activeEvents: number;
    totalPartners: number;
  };
  partners: PartnerRow[];
}

export default function BusinessOverviewView({ locale }: { locale: string }) {
  const en = locale === "en";
  const t = {
    title: en ? "Business overview" : "Visão de negócio",
    subtitle: en ? "Revenue and portfolio across every partner." : "Receita e portfólio por cada parceiro.",
    totalRevenue: en ? "Total revenue" : "Receita total",
    monthRevenue: en ? "Revenue this month" : "Receita este mês",
    totalEvents: en ? "Total events" : "Eventos totais",
    activeEvents: en ? "Active accounts" : "Contas ativas",
    totalPartners: en ? "Partners" : "Parceiros",
    partnersTitle: en ? "Revenue by partner" : "Receita por parceiro",
    partner: en ? "Partner" : "Parceiro",
    events: en ? "Events" : "Eventos",
    active: en ? "Active" : "Ativos",
    revenue: en ? "Revenue" : "Receita",
    lastPayment: en ? "Last payment" : "Último pagamento",
    never: en ? "never" : "nunca",
    loadError: en ? "Could not load business data." : "Não foi possível carregar os dados de negócio.",
  };

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const kpiCard = (icon: React.ReactNode, label: string, value: string) => (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-brand/5 flex items-center justify-center text-brand shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 truncate">{label}</p>
        <p className="font-serif text-2xl text-ink truncate">{value}</p>
      </div>
    </div>
  );

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {kpiCard(<Wallet size={20} />, t.totalRevenue, formatPriceCents(data.kpis.totalRevenueCents, locale))}
            {kpiCard(<TrendingUp size={20} />, t.monthRevenue, formatPriceCents(data.kpis.monthRevenueCents, locale))}
            {kpiCard(<CalendarClock size={20} />, t.totalEvents, String(data.kpis.totalEvents))}
            {kpiCard(<Users size={20} />, t.activeEvents, String(data.kpis.activeEvents))}
            {kpiCard(<Building2 size={20} />, t.totalPartners, String(data.kpis.totalPartners))}
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-cream/50">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.partnersTitle}</span>
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
                  </tr>
                </thead>
                <tbody>
                  {data.partners.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-cream/40 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-ink">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{p.events}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{p.active}</td>
                      <td className="px-6 py-4 text-sm font-serif text-brand text-right">{formatPriceCents(p.revenueCents, locale)}</td>
                      <td className="px-6 py-4 text-[11px] text-gray-400 text-right whitespace-nowrap">{fmtDate(p.lastPaymentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
