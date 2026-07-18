"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ALL_MODULE_IDS, type ModuleId } from "@/lib/modules";
import { BUNDLES } from "@/lib/pricing";
import { Plus, Trash2, Loader2, Ticket, Power } from "lucide-react";

interface CouponRow {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  applies_to_module_id: ModuleId | null;
  applies_to_bundle_id: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

const MODULE_LABELS: Record<ModuleId, string> = {
  save_the_date: "Save the Date",
  invite: "Convite de Casamento",
  guests_seating: "Convidados & Mesas",
  photo_sharing: "Photo Sharing",
  guestbook: "Guestbook",
};

export default function CouponsManagementView({ locale }: { locale: string }) {
  const en = locale === "en";
  const t = {
    title: en ? "Coupons" : "Cupões",
    subtitle: en ? "Discount codes for module and bundle purchases." : "Códigos de desconto para compras de módulos e pacotes.",
    createTitle: en ? "New coupon" : "Novo cupão",
    codeLbl: en ? "Code" : "Código",
    codePh: en ? "e.g. WELCOME10" : "Ex.: BEMVINDO10",
    typeLbl: en ? "Discount type" : "Tipo de desconto",
    percent: en ? "Percentage" : "Percentagem",
    fixed: en ? "Fixed amount" : "Valor fixo",
    valueLbl: en ? "Value" : "Valor",
    valuePctPh: en ? "e.g. 10 (%)" : "Ex.: 10 (%)",
    valueFixedPh: en ? "in cents, e.g. 500 = 5€" : "em cêntimos, ex.: 500 = 5€",
    scopeLbl: en ? "Restrict to" : "Restringir a",
    scopeAny: en ? "Whole order" : "Toda a compra",
    scopeModule: en ? "Single module" : "Um módulo",
    scopeBundle: en ? "Single bundle" : "Um pacote",
    maxLbl: en ? "Max redemptions (optional)" : "Máx. resgates (opcional)",
    maxPh: en ? "unlimited if empty" : "ilimitado se vazio",
    expiresLbl: en ? "Expires at (optional)" : "Expira em (opcional)",
    create: en ? "Create coupon" : "Criar cupão",
    existing: en ? "Coupons" : "Cupões",
    none: en ? "No coupons yet." : "Ainda não há cupões.",
    remove: en ? "Remove" : "Remover",
    codeTaken: en ? "That code is already in use." : "Esse código já está em uso.",
    removeConfirm: en ? "Remove this coupon permanently?" : "Remover este cupão definitivamente?",
    active: en ? "Active" : "Ativo",
    inactive: en ? "Inactive" : "Inativo",
    redeemed: en ? "redeemed" : "resgatado(s)",
    unlimited: en ? "unlimited" : "ilimitado",
    noExpiry: en ? "no expiry" : "sem expiração",
    missingCode: en ? "Enter a code." : "Indique um código.",
    invalidValue: en ? "Enter a valid value." : "Indique um valor válido.",
  };

  const [rows, setRows] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [scope, setScope] = useState<"any" | "module" | "bundle">("any");
  const [scopeModule, setScopeModule] = useState<ModuleId>(ALL_MODULE_IDS[0]);
  const [scopeBundle, setScopeBundle] = useState<string>(BUNDLES[0]?.id || "");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setRows((data as CouponRow[]) || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createCoupon = async () => {
    setMsg("");
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) { setMsg(t.missingCode); return; }
    const value = Number(discountValue);
    if (!value || value <= 0) { setMsg(t.invalidValue); return; }

    setCreating(true);
    const { error } = await supabase.from("coupons").insert([{
      code: normalizedCode,
      discount_type: discountType,
      discount_value: discountType === "percent" ? Math.min(100, Math.round(value)) : Math.round(value),
      applies_to_module_id: scope === "module" ? scopeModule : null,
      applies_to_bundle_id: scope === "bundle" ? scopeBundle : null,
      max_redemptions: maxRedemptions ? Math.max(1, Math.round(Number(maxRedemptions))) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true,
    }]);

    if (error) {
      setMsg(error.code === "23505" ? t.codeTaken : error.message);
    } else {
      setCode(""); setDiscountValue(""); setMaxRedemptions(""); setExpiresAt(""); setScope("any");
      await load();
    }
    setCreating(false);
  };

  const toggleActive = async (row: CouponRow) => {
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, active: !r.active } : r)));
    await supabase.from("coupons").update({ active: !row.active }).eq("id", row.id);
  };

  const removeCoupon = async (id: string) => {
    if (!confirm(t.removeConfirm)) return;
    setRows(prev => prev.filter(r => r.id !== id));
    await supabase.from("coupons").delete().eq("id", id);
  };

  const formatDiscount = (row: CouponRow) =>
    row.discount_type === "percent" ? `-${row.discount_value}%` : `-${(row.discount_value / 100).toFixed(2)}€`;

  const formatScope = (row: CouponRow) => {
    if (row.applies_to_module_id) return MODULE_LABELS[row.applies_to_module_id];
    if (row.applies_to_bundle_id) return row.applies_to_bundle_id;
    return t.scopeAny;
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-ink focus:ring-0 focus:border-brand outline-none";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      {/* Criar cupão */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <h2 className="font-serif text-2xl text-ink mb-6">{t.createTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.codeLbl}</label>
            <input className={inputCls} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={t.codePh} />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.typeLbl}</label>
            <select className={inputCls} value={discountType} onChange={e => setDiscountType(e.target.value as "percent" | "fixed")}>
              <option value="percent">{t.percent}</option>
              <option value="fixed">{t.fixed}</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.valueLbl}</label>
            <input
              type="number"
              className={inputCls}
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? t.valuePctPh : t.valueFixedPh}
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.scopeLbl}</label>
            <select className={inputCls} value={scope} onChange={e => setScope(e.target.value as "any" | "module" | "bundle")}>
              <option value="any">{t.scopeAny}</option>
              <option value="module">{t.scopeModule}</option>
              <option value="bundle">{t.scopeBundle}</option>
            </select>
          </div>

          {scope === "module" && (
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.scopeModule}</label>
              <select className={inputCls} value={scopeModule} onChange={e => setScopeModule(e.target.value as ModuleId)}>
                {ALL_MODULE_IDS.map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
              </select>
            </div>
          )}
          {scope === "bundle" && (
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.scopeBundle}</label>
              <select className={inputCls} value={scopeBundle} onChange={e => setScopeBundle(e.target.value)}>
                {BUNDLES.map(b => <option key={b.id} value={b.id}>{b.id}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.maxLbl}</label>
            <input type="number" className={inputCls} value={maxRedemptions} onChange={e => setMaxRedemptions(e.target.value)} placeholder={t.maxPh} />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.expiresLbl}</label>
            <input type="date" className={inputCls} value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
        </div>

        {msg && <p className="text-[11px] text-red-500 mt-4">{msg}</p>}

        <button onClick={createCoupon} disabled={creating} className="mt-6 inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50">
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {t.create}
        </button>
      </div>

      {/* Lista de cupões */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-cream/50">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.existing}</span>
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">{t.none}</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map(r => (
              <li key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-brand">
                    <Ticket size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-ink font-semibold truncate">
                      {r.code} <span className="text-brand font-normal">{formatDiscount(r)}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formatScope(r)} · {r.times_redeemed}/{r.max_redemptions ?? t.unlimited} {t.redeemed} · {r.expires_at ? new Date(r.expires_at).toLocaleDateString(en ? "en-US" : "pt-PT") : t.noExpiry}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleActive(r)}
                    className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${r.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
                  >
                    <Power size={11} /> {r.active ? t.active : t.inactive}
                  </button>
                  <button onClick={() => removeCoupon(r.id)} className="text-gray-300 hover:text-red-500 transition-colors" title={t.remove}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
