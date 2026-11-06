"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { formatPriceCents } from "@/lib/checkout";
import { Loader2, Copy, Check, Megaphone, Tag, ClipboardList, Globe, Receipt, AlertTriangle, ArrowRight } from "lucide-react";

// Área "Parceiro" (lista de eventos, membros de um parceiro): as condições do
// parceiro escritas por extenso, as recomendações (link, código, vendas e
// comissões) e os eventos que gere, com quem paga e quanto custou. Os dados vêm
// de api/partner/overview. Só aparecem os blocos das funcionalidades ligadas.

type Overview = {
  brand: { id: string; name: string; domain?: string | null; planning?: boolean };
  features: { referral: boolean; partnerPrice: boolean; planning: boolean; ownBrand: boolean };
  terms: null | {
    commissionPct: number; referralCode: string | null;
    partnerPriceCents: number; volumePriceCents: number; volumeThreshold: number;
    nextPriceCents: number | null; nextIsVolume: boolean;
    billing: { name: string | null; nif: string | null; hasIban: boolean };
  };
  referrals: { id: string; eventDate: string | null; paidAt: string; amountCents: number; commissionPct: number; commissionCents: number; status: string; approvesAt: string | null; paidOutAt: string | null }[];
  referralTotals: { pending: number; approved: number; paid: number; referredNotPaid: number };
  events: { id: string; slug: string; name: string; eventDate: string | null; published: boolean; payer: "partner" | "couple"; paidCents: number }[];
  partnerPaidCount: number;
};

export default function PartnerAreaView({ locale, onOpenEvent }: { locale: string; onOpenEvent: (slug: string) => void }) {
  const en = locale === "en";
  const t = {
    title: en ? "Partner area" : "Área de parceiro",
    subtitle: en ? "Your terms, your referrals and the events you manage, in one place." : "As vossas condições, as vossas recomendações e os eventos que gerem, num só sítio.",
    terms: en ? "Your terms" : "As vossas condições",
    referral: en ? "Referrals" : "Recomendação",
    commission: en ? "Commission on each couple who publishes, on the amount paid excluding VAT" : "Comissão por cada casal que publica, sobre o valor pago sem IVA",
    partnerPrice: en ? "Partner price per wedding" : "Preço de parceiro por casamento",
    volume: en ? "From wedding no. {n}" : "A partir do {n}.º casamento",
    paidSoFar: en ? "Weddings you've paid for so far" : "Casamentos já pagos por vocês",
    next: en ? "Your next wedding costs" : "O vosso próximo casamento custa",
    planning: en ? "Planning (wedding planner module)" : "Planeamento (módulo wedding planner)",
    planningOn: en ? "Included, no subscription" : "Incluído, sem mensalidade",
    ownBrand: en ? "Your brand" : "Marca própria",
    yourLink: en ? "Your link" : "O vosso link",
    yourCode: en ? "Your code" : "O vosso código",
    codeHint: en ? "Couples can also type this code when they pay." : "Os noivos também podem escrever este código quando pagam.",
    copy: en ? "Copy" : "Copiar",
    copied: en ? "Copied" : "Copiado",
    sales: en ? "Your referrals" : "As vossas recomendações",
    noSales: en ? "No paid referrals yet." : "Ainda não há recomendações pagas.",
    waiting: en ? "{n} referred couple(s) haven't published yet." : "{n} casal(is) recomendado(s) ainda não publicaram.",
    colWedding: en ? "Wedding" : "Casamento",
    colPaid: en ? "Paid on" : "Pago a",
    colAmount: en ? "Amount" : "Valor",
    colCommission: en ? "Commission" : "Comissão",
    colStatus: en ? "Status" : "Estado",
    status: {
      pending: en ? "Pending until {d}" : "Pendente até {d}",
      approved: en ? "Approved, to be paid" : "Aprovada, por pagar",
      paid: en ? "Paid on {d}" : "Paga a {d}",
      cancelled: en ? "Cancelled (refund)" : "Cancelada (reembolso)",
    } as Record<string, string>,
    totPending: en ? "Pending" : "Pendente",
    totApproved: en ? "To receive" : "A receber",
    totPaid: en ? "Paid" : "Já pago",
    rules: en
      ? "Commissions are approved 14 days after the payment (refund period) and paid by bank transfer once a month. You need to send us an invoice or receipt for the amount."
      : "As comissões ficam aprovadas 14 dias depois do pagamento (prazo de reembolso) e são pagas por transferência, uma vez por mês. Precisam de nos enviar fatura ou recibo do valor.",
    billing: en ? "Billing details" : "Dados de faturação",
    billingMissing: en ? "Missing VAT no. or IBAN: send them to us so we can pay your commissions." : "Falta o NIF ou o IBAN: enviem-nos estes dados para podermos pagar as comissões.",
    billingChange: en ? "To change them, contact us." : "Para os alterar, contactem-nos.",
    events: en ? "Your events" : "Os vossos eventos",
    noEvents: en ? "No events yet." : "Ainda não há eventos.",
    colPayer: en ? "Who pays" : "Quem paga",
    payerPartner: en ? "You" : "Vocês",
    payerCouple: en ? "The couple" : "Os noivos",
    published: en ? "Published" : "Publicado",
    notPublished: en ? "Not published" : "Por publicar",
    open: en ? "Open" : "Abrir",
    off: en ? "Not active. Talk to us if you're interested." : "Não está ativo. Falem connosco se tiverem interesse.",
  };

  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/partner/overview", { headers: { authorization: `Bearer ${s.session?.access_token ?? ""}` }, cache: "no-store" });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error || "Erro"); return; }
      setData(await res.json());
    })();
  }, []);

  if (error) return <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center text-sm text-gray-500">{error}</div>;
  if (!data) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;

  const fmt = (c: number) => formatPriceCents(c || 0, locale);
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString(en ? "en-GB" : "pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.digitalinvitestudio.com";
  const link = data.terms?.referralCode ? `${origin}/r/${data.terms.referralCode}` : "";
  const copy = (key: string, v: string) => { navigator.clipboard.writeText(v); setCopied(key); setTimeout(() => setCopied(null), 1800); };
  const card = "bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm";
  const label = "text-[9px] font-bold uppercase tracking-widest text-gray-400";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title} · {data.brand.name}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      {/* Condições */}
      <section className={card}>
        <h2 className="font-serif text-2xl text-ink mb-6">{t.terms}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-2xl border p-4 ${data.features.referral ? "border-gold-soft bg-cream" : "border-gray-100 opacity-60"}`}>
            <p className={`${label} flex items-center gap-1.5 mb-2`}><Megaphone size={11} /> {t.referral}</p>
            {data.features.referral && data.terms ? (
              <><p className="font-serif text-3xl text-brand">{data.terms.commissionPct}%</p><p className="text-[11px] text-gray-500 mt-1">{t.commission}</p></>
            ) : <p className="text-xs text-gray-500">{t.off}</p>}
          </div>
          <div className={`rounded-2xl border p-4 ${data.features.partnerPrice ? "border-gold-soft bg-cream" : "border-gray-100 opacity-60"}`}>
            <p className={`${label} flex items-center gap-1.5 mb-2`}><Tag size={11} /> {t.partnerPrice}</p>
            {data.features.partnerPrice && data.terms ? (
              <>
                <p className="font-serif text-3xl text-brand">{fmt(data.terms.partnerPriceCents)}</p>
                <p className="text-[11px] text-gray-500 mt-1">{t.volume.replace("{n}", String(data.terms.volumeThreshold))}: <strong>{fmt(data.terms.volumePriceCents)}</strong></p>
                <p className="text-[11px] text-gray-500">{t.paidSoFar}: <strong>{data.partnerPaidCount}</strong></p>
                {data.terms.nextPriceCents != null && <p className="text-[11px] text-ink mt-1">{t.next}: <strong>{fmt(data.terms.nextPriceCents)}</strong></p>}
              </>
            ) : <p className="text-xs text-gray-500">{t.off}</p>}
          </div>
          <div className={`rounded-2xl border p-4 ${data.features.planning ? "border-gold-soft bg-cream" : "border-gray-100 opacity-60"}`}>
            <p className={`${label} flex items-center gap-1.5 mb-2`}><ClipboardList size={11} /> {t.planning}</p>
            <p className="text-sm text-ink">{data.features.planning ? t.planningOn : t.off}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${data.features.ownBrand ? "border-gold-soft bg-cream" : "border-gray-100 opacity-60"}`}>
            <p className={`${label} flex items-center gap-1.5 mb-2`}><Globe size={11} /> {t.ownBrand}</p>
            <p className="text-sm text-ink">{data.features.ownBrand ? (data.brand.domain || data.brand.name) : t.off}</p>
          </div>
        </div>
      </section>

      {/* Recomendações */}
      {data.features.referral && data.terms && (
        <section className={card}>
          <h2 className="font-serif text-2xl text-ink mb-6">{t.sales}</h2>
          {data.terms.referralCode && (
            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center mb-8">
              <div className="space-y-4">
                <div>
                  <p className={`${label} mb-1.5`}>{t.yourLink}</p>
                  <div className="flex gap-2">
                    <input readOnly value={link} className="flex-1 bg-cream border border-gold-soft/60 rounded-xl px-3 py-2 text-sm text-ink" />
                    <button onClick={() => copy("link", link)} className="inline-flex items-center gap-1.5 px-4 rounded-xl bg-brand text-gold-soft text-[10px] font-bold uppercase tracking-widest">
                      {copied === "link" ? <Check size={13} /> : <Copy size={13} />} {copied === "link" ? t.copied : t.copy}
                    </button>
                  </div>
                </div>
                <div>
                  <p className={`${label} mb-1.5`}>{t.yourCode}</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg tracking-widest text-ink bg-cream border border-gold-soft/60 rounded-xl px-4 py-2">{data.terms.referralCode}</span>
                    <button onClick={() => copy("code", data.terms!.referralCode!)} className="text-[10px] font-bold uppercase tracking-widest text-brand">{copied === "code" ? t.copied : t.copy}</button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">{t.codeHint}</p>
                </div>
              </div>
              <div className="p-3 bg-cream rounded-2xl border border-gold-soft/60 justify-self-center"><QRCodeSVG value={link} size={120} fgColor="#332E2B" bgColor="transparent" /></div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[[t.totPending, data.referralTotals.pending], [t.totApproved, data.referralTotals.approved], [t.totPaid, data.referralTotals.paid]].map(([l, v]) => (
              <div key={l as string} className="rounded-2xl bg-cream border border-gold-soft/40 p-4">
                <p className={label}>{l}</p>
                <p className="font-serif text-2xl text-ink mt-1">{fmt(v as number)}</p>
              </div>
            ))}
          </div>
          {data.referralTotals.referredNotPaid > 0 && <p className="text-xs text-gray-500 mb-4">{t.waiting.replace("{n}", String(data.referralTotals.referredNotPaid))}</p>}

          {data.referrals.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">{t.noSales}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[560px]">
                <thead><tr className="border-b border-gray-100">{[t.colWedding, t.colPaid, t.colAmount, t.colCommission, t.colStatus].map(h => <th key={h} className={`${label} py-3 pr-4`}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.referrals.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-ink">{fmtDate(r.eventDate)}</td>
                      <td className="py-3 pr-4 text-gray-500">{fmtDate(r.paidAt)}</td>
                      <td className="py-3 pr-4 text-gray-600">{fmt(r.amountCents)}</td>
                      <td className="py-3 pr-4 font-semibold text-ink">{fmt(r.commissionCents)} <span className="text-[10px] text-gray-400 font-normal">({r.commissionPct}%)</span></td>
                      <td className="py-3 pr-4 text-xs">
                        <span className={r.status === "paid" ? "text-green-700" : r.status === "approved" ? "text-brand" : r.status === "cancelled" ? "text-gray-400" : "text-amber-700"}>
                          {(t.status[r.status] || r.status).replace("{d}", fmtDate(r.status === "paid" ? r.paidOutAt : r.approvesAt))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-gray-500 mt-5 leading-relaxed">{t.rules}</p>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className={`${label} flex items-center gap-1.5 mb-2`}><Receipt size={11} /> {t.billing}</p>
            <p className="text-sm text-ink">{data.terms.billing.name || "—"} · NIF {data.terms.billing.nif || "—"} · IBAN {data.terms.billing.hasIban ? "✓" : "—"}</p>
            {(!data.terms.billing.nif || !data.terms.billing.hasIban) && (
              <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5"><AlertTriangle size={12} /> {t.billingMissing}</p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">{t.billingChange}</p>
          </div>
        </section>
      )}

      {/* Eventos do parceiro */}
      <section className={card}>
        <h2 className="font-serif text-2xl text-ink mb-6">{t.events}</h2>
        {data.events.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t.noEvents}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[620px]">
              <thead><tr className="border-b border-gray-100">{[t.colWedding, "", t.colPayer, t.colStatus, t.colAmount, ""].map((h, i) => <th key={i} className={`${label} py-3 pr-4`}>{h}</th>)}</tr></thead>
              <tbody>
                {data.events.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 font-serif text-lg text-ink">{e.name}</td>
                    <td className="py-3 pr-4 text-gray-500">{fmtDate(e.eventDate)}</td>
                    <td className="py-3 pr-4 text-gray-600">{e.payer === "partner" ? t.payerPartner : t.payerCouple}</td>
                    <td className="py-3 pr-4 text-xs">{e.published ? <span className="text-green-700">{t.published}</span> : <span className="text-gray-400">{t.notPublished}</span>}</td>
                    <td className="py-3 pr-4 text-gray-600">{e.paidCents ? fmt(e.paidCents) : "—"}</td>
                    <td className="py-3 text-right"><button onClick={() => onOpenEvent(e.slug)} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand">{t.open} <ArrowRight size={12} /></button></td>
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
