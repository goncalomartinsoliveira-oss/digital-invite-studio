"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPriceCents } from "@/lib/checkout";
import { Loader2, Download, CheckCircle2, AlertTriangle } from "lucide-react";

// Comissões de recomendação (super admin › Administração › Comissões).
// Por parceiro: pendente, a pagar (aprovadas: 14 dias depois do pagamento) e
// já pago, com os dados de faturação e o botão "Marcar como pagas" (pagamento
// mensal). Por baixo, todas as vendas com comissão. Dados: api/admin/commissions.

type Commission = { id: string; brandId: string; brandName: string; event: string; eventDate: string | null; paidAt: string; amountCents: number; commissionPct: number; commissionCents: number; status: string; approvesAt: string | null; paidOutAt: string | null };
type PartnerTotals = { brandId: string; brandName: string; pending: number; approved: number; paid: number; billing: { name: string | null; nif: string | null; iban: string | null } };

export default function CommissionsView({ locale }: { locale: string }) {
  const en = locale === "en";
  const t = {
    title: en ? "Commissions" : "Comissões",
    subtitle: en
      ? "Referral commissions per partner. A commission is approved 14 days after the payment and paid once a month by bank transfer."
      : "Comissões de recomendação por parceiro. Uma comissão fica aprovada 14 dias depois do pagamento e paga-se uma vez por mês, por transferência.",
    byPartner: en ? "By partner" : "Por parceiro",
    pending: en ? "Pending" : "Pendente",
    approved: en ? "To pay" : "A pagar",
    paid: en ? "Paid" : "Pago",
    markPaid: en ? "Mark as paid" : "Marcar como pagas",
    confirm: en ? "Mark {v} as paid to {p}? Do this after the bank transfer." : "Marcar {v} como pagos a {p}? Façam isto depois da transferência.",
    done: en ? "{n} commission(s) marked as paid ({v})." : "{n} comissão(ões) marcadas como pagas ({v}).",
    missingBilling: en ? "Missing VAT no. or IBAN" : "Falta NIF ou IBAN",
    all: en ? "All sales with commission" : "Todas as vendas com comissão",
    none: en ? "No commissions yet." : "Ainda não há comissões.",
    filterAll: en ? "All" : "Todas",
    csv: en ? "Export CSV" : "Exportar CSV",
    colPartner: en ? "Partner" : "Parceiro",
    colEvent: en ? "Event" : "Evento",
    colPaid: en ? "Paid on" : "Pago a",
    colAmount: en ? "Amount" : "Valor",
    colCommission: en ? "Commission" : "Comissão",
    colStatus: en ? "Status" : "Estado",
    status: {
      pending: en ? "Pending until {d}" : "Pendente até {d}",
      approved: en ? "To pay" : "A pagar",
      paid: en ? "Paid on {d}" : "Paga a {d}",
      cancelled: en ? "Cancelled" : "Cancelada",
    } as Record<string, string>,
  };

  const [rows, setRows] = useState<Commission[] | null>(null);
  const [partners, setPartners] = useState<PartnerTotals[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const auth = async () => {
    const { data } = await supabase.auth.getSession();
    return { authorization: `Bearer ${data.session?.access_token ?? ""}` };
  };
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/commissions", { headers: await auth(), cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error || "Erro"); setRows([]); return; }
    setRows(j.commissions); setPartners(j.partners);
  }, []);
  useEffect(() => { load(); }, [load]);

  const fmt = (c: number) => formatPriceCents(c || 0, locale);
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString(en ? "en-GB" : "pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const markPaid = async (p: PartnerTotals) => {
    if (!confirm(t.confirm.replace("{v}", fmt(p.approved)).replace("{p}", p.brandName))) return;
    setBusy(p.brandId);
    const res = await fetch("/api/admin/commissions", { method: "POST", headers: { "content-type": "application/json", ...(await auth()) }, body: JSON.stringify({ action: "markPaid", brandId: p.brandId }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) alert(j.error || "Erro");
    else alert(t.done.replace("{n}", String(j.count)).replace("{v}", fmt(j.totalCents)));
    setBusy(null);
    load();
  };

  const exportCsv = () => {
    const head = [t.colPartner, t.colEvent, "Data do evento", t.colPaid, t.colAmount, "%", t.colCommission, t.colStatus];
    const lines = (rows || []).map(r => [r.brandName, r.event, fmtDate(r.eventDate), fmtDate(r.paidAt), (r.amountCents / 100).toFixed(2).replace(".", ","), String(r.commissionPct), (r.commissionCents / 100).toFixed(2).replace(".", ","), r.status]);
    const csv = [head, ...lines].map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `comissoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (!rows) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  const shown = filter === "all" ? rows : rows.filter(r => r.status === filter);
  const label = "text-[9px] font-bold uppercase tracking-widest text-gray-400";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm max-w-3xl">{t.subtitle}</p>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-cream/50"><span className={label}>{t.byPartner}</span></div>
        {partners.length === 0 ? <p className="p-10 text-center text-sm text-gray-400">{t.none}</p> : (
          <ul className="divide-y divide-gray-50">
            {partners.map(p => (
              <li key={p.brandId} className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-xl text-ink">{p.brandName}</p>
                  <p className="text-[11px] text-gray-500">{p.billing.name || "—"} · NIF {p.billing.nif || "—"} · IBAN {p.billing.iban || "—"}</p>
                  {(!p.billing.nif || !p.billing.iban) && <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5"><AlertTriangle size={11} /> {t.missingBilling}</p>}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right"><p className={label}>{t.pending}</p><p className="text-sm text-gray-600">{fmt(p.pending)}</p></div>
                  <div className="text-right"><p className={label}>{t.approved}</p><p className="font-serif text-xl text-brand">{fmt(p.approved)}</p></div>
                  <div className="text-right"><p className={label}>{t.paid}</p><p className="text-sm text-green-700">{fmt(p.paid)}</p></div>
                  <button onClick={() => markPaid(p)} disabled={!p.approved || busy === p.brandId}
                    className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-30">
                    {busy === p.brandId ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {t.markPaid}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-cream/50 flex flex-wrap items-center justify-between gap-3">
          <span className={label}>{t.all}</span>
          <div className="flex items-center gap-2">
            {["all", "pending", "approved", "paid", "cancelled"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${filter === f ? "bg-brand text-gold-soft" : "text-gray-400 hover:text-brand"}`}>
                {f === "all" ? t.filterAll : f === "pending" ? t.pending : f === "approved" ? t.approved : f === "paid" ? t.paid : t.status.cancelled}
              </button>
            ))}
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand"><Download size={11} /> {t.csv}</button>
          </div>
        </div>
        {shown.length === 0 ? <p className="p-10 text-center text-sm text-gray-400">{t.none}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead><tr className="border-b border-gray-100">{[t.colPartner, t.colEvent, t.colPaid, t.colAmount, t.colCommission, t.colStatus].map(h => <th key={h} className={`${label} px-6 py-3`}>{h}</th>)}</tr></thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-3 text-ink">{r.brandName}</td>
                    <td className="px-6 py-3 text-gray-600">{r.event} <span className="text-[10px] text-gray-400">· {fmtDate(r.eventDate)}</span></td>
                    <td className="px-6 py-3 text-gray-500">{fmtDate(r.paidAt)}</td>
                    <td className="px-6 py-3 text-gray-600">{fmt(r.amountCents)}</td>
                    <td className="px-6 py-3 font-semibold text-ink">{fmt(r.commissionCents)} <span className="text-[10px] text-gray-400 font-normal">({r.commissionPct}%)</span></td>
                    <td className="px-6 py-3 text-xs">{(t.status[r.status] || r.status).replace("{d}", fmtDate(r.status === "paid" ? r.paidOutAt : r.approvesAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
