"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Megaphone, Tag, ClipboardList, Receipt } from "lucide-react";
import { PARTNER_DEFAULTS, type PartnerAccount } from "@/lib/partnerPricing";
import { formatPriceCents } from "@/lib/checkout";

// Ficha de um parceiro (super admin › Administração › Parceiros): as
// funcionalidades ligadas e as condições comerciais, todas editáveis parceiro
// a parceiro. Guarda em partner_accounts (migração 0015); o Planeamento
// continua em brands.planner_plan (qualquer valor = ligado).

type Props = {
  brandId: string;
  plannerOn: boolean;
  onPlannerChange: (on: boolean) => void;
  locale: string;
};

const euros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
const toCents = (v: string) => Math.round(parseFloat(v.replace(",", ".")) * 100);

export default function PartnerTermsCard({ brandId, plannerOn, onPlannerChange, locale }: Props) {
  const en = locale === "en";
  const t = {
    features: en ? "Features" : "Funcionalidades",
    referral: en ? "Referrals (affiliate)" : "Recomendação (afiliado)",
    referralHint: en ? "Gets a commission on couples who pay through their link or code." : "Ganha comissão sobre os casais que pagam com o link ou o código dele.",
    partnerPrice: en ? "Partner price (resale)" : "Preço de parceiro (revenda)",
    partnerPriceHint: en ? "Pays less for the events they manage and charges the couple what they want." : "Paga menos nos eventos que gere e cobra ao casal o que quiser.",
    planner: en ? "Planning (wedding planner module)" : "Planeamento (módulo wedding planner)",
    plannerHint: en ? "Budget, vendors, tasks, timeline, This week." : "Orçamento, fornecedores, tarefas, cronograma, Esta semana.",
    commission: en ? "Commission (%)" : "Comissão (%)",
    code: en ? "Referral code" : "Código de recomendação",
    codeHint: en ? "Link:" : "Link:",
    price: en ? "Partner price (€)" : "Preço de parceiro (€)",
    volumePrice: en ? "Volume price (€)" : "Preço de volume (€)",
    threshold: en ? "From wedding no." : "A partir do casamento n.º",
    paidSoFar: en ? "Weddings paid by this partner so far" : "Casamentos já pagos por este parceiro",
    nextPrice: en ? "Next one costs" : "O próximo custa",
    billing: en ? "Billing (for commission payouts)" : "Faturação (para pagar comissões)",
    billingName: en ? "Name / company" : "Nome / empresa",
    nif: en ? "VAT no. (NIF)" : "NIF",
    iban: "IBAN",
    notes: en ? "Internal notes" : "Notas internas",
    save: en ? "Save terms" : "Guardar condições",
    saved: en ? "Saved" : "Guardado",
    missingMigration: en ? "Run migration 0015 in Supabase first." : "Falta correr a migração 0015 no Supabase.",
    codeTaken: en ? "That code is already used by another partner." : "Esse código já é usado por outro parceiro.",
  };

  const [acc, setAcc] = useState<PartnerAccount | null>(null);
  const [form, setForm] = useState({ commission: "15", code: "", price: "79,00", volume: "69,00", threshold: "10", billingName: "", nif: "", iban: "", notes: "", referral: false, partnerPrice: false });
  const [paidCount, setPaidCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data, error }, { data: evs }] = await Promise.all([
        supabase.from("partner_accounts").select("*").eq("brand_id", brandId).maybeSingle(),
        supabase.from("invitations").select("id, unlocked_modules, paid_by").eq("brand_id", brandId),
      ]);
      if (error) setMsg(t.missingMigration);
      const a = (data as PartnerAccount) || null;
      setAcc(a);
      setForm({
        commission: String(a?.commission_pct ?? PARTNER_DEFAULTS.commission_pct),
        code: a?.referral_code ?? "",
        price: euros(a?.partner_price_cents ?? PARTNER_DEFAULTS.partner_price_cents),
        volume: euros(a?.partner_volume_price_cents ?? PARTNER_DEFAULTS.partner_volume_price_cents),
        threshold: String(a?.partner_volume_threshold ?? PARTNER_DEFAULTS.partner_volume_threshold),
        billingName: a?.billing_name ?? "", nif: a?.billing_nif ?? "", iban: a?.billing_iban ?? "", notes: a?.notes ?? "",
        referral: !!a?.referral_enabled, partnerPrice: !!a?.partner_price_enabled,
      });
      setPaidCount(((evs as any[]) || []).filter(i => (i.unlocked_modules || []).includes("invite") && i.paid_by !== "couple").length);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const save = async () => {
    setSaving(true); setMsg("");
    const row = {
      brand_id: brandId,
      referral_enabled: form.referral,
      commission_pct: Math.max(0, Math.min(100, parseFloat(form.commission.replace(",", ".")) || 0)),
      referral_code: form.code.trim().toUpperCase() || null,
      partner_price_enabled: form.partnerPrice,
      partner_price_cents: toCents(form.price) || PARTNER_DEFAULTS.partner_price_cents,
      partner_volume_price_cents: toCents(form.volume) || PARTNER_DEFAULTS.partner_volume_price_cents,
      partner_volume_threshold: Math.max(1, parseInt(form.threshold, 10) || PARTNER_DEFAULTS.partner_volume_threshold),
      billing_name: form.billingName.trim() || null,
      billing_nif: form.nif.trim() || null,
      billing_iban: form.iban.replace(/\s+/g, " ").trim() || null,
      notes: form.notes.trim() || null,
    };
    const { data, error } = await supabase.from("partner_accounts").upsert(row, { onConflict: "brand_id" }).select("*").maybeSingle();
    if (error) setMsg(error.code === "23505" ? t.codeTaken : /partner_accounts/.test(error.message) ? t.missingMigration : error.message);
    else { setAcc(data as PartnerAccount); setMsg(t.saved); }
    setSaving(false);
  };

  if (loading) return <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;

  const input = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const label = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block";
  const threshold = Math.max(1, parseInt(form.threshold, 10) || 10);
  const nextIsVolume = paidCount != null && paidCount + 1 >= threshold;
  const Toggle = ({ on, onChange, icon, title, hint }: { on: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; title: string; hint: string }) => (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`text-left rounded-2xl border px-4 py-3 flex gap-3 items-start transition-colors ${on ? "border-brand bg-brand/5" : "border-gray-200 hover:border-gray-300"}`}>
      <span className={`mt-0.5 ${on ? "text-brand" : "text-gray-300"}`}>{icon}</span>
      <span>
        <span className={`block text-sm font-semibold ${on ? "text-brand" : "text-ink"}`}>{title} · {on ? (en ? "On" : "Ligado") : (en ? "Off" : "Desligado")}</span>
        <span className="block text-[11px] text-gray-500 leading-relaxed">{hint}</span>
      </span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className={label}>{t.features}</p>
        <div className="grid md:grid-cols-3 gap-3">
          <Toggle on={form.referral} onChange={v => setForm(f => ({ ...f, referral: v }))} icon={<Megaphone size={16} />} title={t.referral} hint={t.referralHint} />
          <Toggle on={form.partnerPrice} onChange={v => setForm(f => ({ ...f, partnerPrice: v }))} icon={<Tag size={16} />} title={t.partnerPrice} hint={t.partnerPriceHint} />
          <Toggle on={plannerOn} onChange={onPlannerChange} icon={<ClipboardList size={16} />} title={t.planner} hint={t.plannerHint} />
        </div>
      </div>

      {form.referral && (
        <div className="grid sm:grid-cols-[140px_1fr] gap-4">
          <div><label className={label}>{t.commission}</label><input className={input} inputMode="decimal" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} /></div>
          <div>
            <label className={label}>{t.code}</label>
            <input className={`${input} uppercase tracking-widest`} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") }))} placeholder="ATELIERLUA" />
            {form.code && <p className="text-[10px] text-gray-400 mt-1">{t.codeHint} digitalinvitestudio.com/r/{form.code}</p>}
          </div>
        </div>
      )}

      {form.partnerPrice && (
        <div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className={label}>{t.price}</label><input className={input} inputMode="decimal" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div><label className={label}>{t.volumePrice}</label><input className={input} inputMode="decimal" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} /></div>
            <div><label className={label}>{t.threshold}</label><input className={input} inputMode="numeric" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value.replace(/\D/g, "") }))} /></div>
          </div>
          {paidCount != null && (
            <p className="text-xs text-gray-500 mt-2">
              {t.paidSoFar}: <strong className="text-ink">{paidCount}</strong> · {t.nextPrice}: <strong className="text-ink">{formatPriceCents(nextIsVolume ? (toCents(form.volume) || 0) : (toCents(form.price) || 0), locale)}</strong>
            </p>
          )}
        </div>
      )}

      <div>
        <p className={`${label} flex items-center gap-1.5`}><Receipt size={11} /> {t.billing}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <input className={input} placeholder={t.billingName} value={form.billingName} onChange={e => setForm(f => ({ ...f, billingName: e.target.value }))} />
          <input className={input} placeholder={t.nif} value={form.nif} onChange={e => setForm(f => ({ ...f, nif: e.target.value }))} />
          <input className={input} placeholder={t.iban} value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value.toUpperCase() }))} />
        </div>
        <textarea className={`${input} mt-3 h-20 resize-none`} placeholder={t.notes} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} {t.save}
        </button>
        {msg && <span className={`text-[11px] ${msg === t.saved ? "text-green-700" : "text-red-600"}`}>{msg}</span>}
      </div>
    </div>
  );
}
