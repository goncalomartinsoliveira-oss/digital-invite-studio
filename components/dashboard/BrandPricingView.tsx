"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ALL_MODULE_IDS, type ModuleId } from "@/lib/modules";
import { BUNDLES, MODULE_PRICES_CENTS } from "@/lib/pricing";
import { formatPriceCents } from "@/lib/checkout";
import { Loader2, Tag, RotateCcw, Save } from "lucide-react";

interface OverrideRow {
  id: string;
  item_type: "module" | "bundle";
  item_id: string;
  price_cents: number;
}

interface BrandPricingViewProps {
  brands: { id: string; name: string }[];
  moduleNames: Record<ModuleId, string>;
  bundleNames: Record<string, string>;
  locale: string;
}

export default function BrandPricingView({ brands, moduleNames, bundleNames, locale }: BrandPricingViewProps) {
  const en = locale === "en";
  const t = {
    title: en ? "Partner pricing" : "Preços por parceiro",
    subtitle: en ? "Set custom module/bundle prices for a specific partner. Anything left blank uses the global price." : "Defina preços de módulos/pacotes diferentes para um parceiro específico. O que ficar em branco usa o preço global.",
    pickBrand: en ? "Partner" : "Parceiro",
    modulesLbl: en ? "Modules" : "Módulos",
    bundlesLbl: en ? "Bundles" : "Pacotes",
    globalPrice: en ? "Global price" : "Preço global",
    customPrice: en ? "Custom price (€)" : "Preço personalizado (€)",
    reset: en ? "Reset to global" : "Repor global",
    save: en ? "Save" : "Guardar",
    saved: en ? "Saved" : "Guardado",
    noBrands: en ? "No partners yet." : "Ainda não há parceiros.",
    pickPrompt: en ? "Choose a partner to edit its pricing." : "Escolha um parceiro para editar os preços.",
  };

  const [selectedBrand, setSelectedBrand] = useState<string>(brands[0]?.id || "");
  const [rows, setRows] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async (brandId: string) => {
    if (!brandId) { setRows([]); return; }
    setLoading(true);
    const { data } = await supabase.from("brand_pricing_overrides").select("*").eq("brand_id", brandId);
    const loaded = (data as OverrideRow[]) || [];
    setRows(loaded);
    const nextDrafts: Record<string, string> = {};
    loaded.forEach(r => { nextDrafts[`${r.item_type}:${r.item_id}`] = (r.price_cents / 100).toString(); });
    setDrafts(nextDrafts);
    setLoading(false);
  }, []);

  useEffect(() => { load(selectedBrand); }, [selectedBrand, load]);

  const keyFor = (itemType: "module" | "bundle", itemId: string) => `${itemType}:${itemId}`;

  const existingRow = (itemType: "module" | "bundle", itemId: string) =>
    rows.find(r => r.item_type === itemType && r.item_id === itemId);

  const saveOverride = async (itemType: "module" | "bundle", itemId: string) => {
    const key = keyFor(itemType, itemId);
    const raw = (drafts[key] || "").trim();
    setSavingKey(key);
    const existing = existingRow(itemType, itemId);

    if (!raw) {
      if (existing) await supabase.from("brand_pricing_overrides").delete().eq("id", existing.id);
    } else {
      const priceCents = Math.round(Number(raw.replace(",", ".")) * 100);
      if (!priceCents || priceCents <= 0) { setSavingKey(null); return; }
      if (existing) {
        await supabase.from("brand_pricing_overrides").update({ price_cents: priceCents }).eq("id", existing.id);
      } else {
        await supabase.from("brand_pricing_overrides").insert([{ brand_id: selectedBrand, item_type: itemType, item_id: itemId, price_cents: priceCents }]);
      }
    }
    await load(selectedBrand);
    setSavingKey(null);
  };

  const inputCls = "w-32 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink focus:ring-0 focus:border-brand outline-none";

  const row = (itemType: "module" | "bundle", itemId: string, label: string, globalCents: number) => {
    const key = keyFor(itemType, itemId);
    const hasOverride = !!existingRow(itemType, itemId);
    return (
      <li key={key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink font-semibold">{label}</p>
          <p className="text-[10px] text-gray-400">{t.globalPrice}: {formatPriceCents(globalCents, locale)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            className={inputCls}
            value={drafts[key] ?? ""}
            onChange={e => setDrafts(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={(globalCents / 100).toString()}
          />
          <button
            onClick={() => saveOverride(itemType, itemId)}
            disabled={savingKey === key}
            className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50"
          >
            {savingKey === key ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t.save}
          </button>
          {hasOverride && (
            <button
              onClick={() => { setDrafts(prev => ({ ...prev, [key]: "" })); saveOverride(itemType, itemId); }}
              className="text-gray-300 hover:text-red-500 transition-colors"
              title={t.reset}
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm max-w-xl">{t.subtitle}</p>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center text-sm text-gray-400">{t.noBrands}</div>
      ) : (
        <>
          <div className="mb-6 max-w-xs">
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.pickBrand}</label>
            <select className={inputCls + " w-full"} value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-cream/50 flex items-center gap-2">
                  <Tag size={12} className="text-gray-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.modulesLbl}</span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {ALL_MODULE_IDS.map(m => row("module", m, moduleNames[m] || m, MODULE_PRICES_CENTS[m]))}
                </ul>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-cream/50 flex items-center gap-2">
                  <Tag size={12} className="text-gray-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.bundlesLbl}</span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {BUNDLES.map(b => row("bundle", b.id, bundleNames[b.id] || b.id, b.priceCents))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
