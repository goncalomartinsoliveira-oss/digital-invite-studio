"use client";
import { useState } from "react";
import { Check, Loader2, Sparkles, Tag } from "lucide-react";
import { BUNDLES, effectiveBundlePriceCents, effectiveBundleSavingsCents, type PricingOverrides } from "@/lib/pricing";
import { startBundleCheckout, formatPriceCents } from "@/lib/checkout";
import type { ModuleId } from "@/lib/modules";

interface BundleOffersDict {
  title: string;
  subtitle: string;
  savingsLabel: string;
  buyBtn: string;
  bundles: Record<string, { name: string; desc: string }>;
  couponToggleLabel?: string;
  couponPlaceholder?: string;
}

interface BundleOffersProps {
  invitationId: string;
  slug: string;
  locale: string;
  unlockedModules: string[];
  isSuperAdmin: boolean;
  moduleNames: Record<ModuleId, string>;
  overrides?: PricingOverrides;
  dict: BundleOffersDict;
}

// Mostra as bundles que ainda fazem sentido oferecer a este evento — uma
// bundle desaparece assim que já tiver pelo menos um dos módulos incluídos,
// para nunca sugerir cobrar a dobrar (o servidor também recusa essa compra).
export default function BundleOffers({ invitationId, slug, locale, unlockedModules, isSuperAdmin, moduleNames, overrides, dict }: BundleOffersProps) {
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [couponVisibleFor, setCouponVisibleFor] = useState<string | null>(null);
  const [couponCodes, setCouponCodes] = useState<Record<string, string>>({});

  if (isSuperAdmin) return null;

  const offers = BUNDLES.filter(b => !b.moduleIds.some(m => unlockedModules.includes(m)));
  if (offers.length === 0) return null;

  const handleBuy = async (bundleId: string) => {
    setBuyingId(bundleId);
    try {
      await startBundleCheckout({ invitationId, slug, locale, bundleId, couponCode: couponCodes[bundleId]?.trim() || undefined });
    } catch (err: any) {
      alert(err.message || "Erro ao iniciar o pagamento.");
      setBuyingId(null);
    }
  };

  return (
    <div className="mt-14">
      <div className="text-center mb-8">
        <h3 className="font-serif text-2xl text-ink">{dict.title}</h3>
        <p className="text-gray-400 text-sm mt-1">{dict.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {offers.map(bundle => {
          const meta = dict.bundles[bundle.id];
          const price = effectiveBundlePriceCents(bundle, overrides);
          const savings = effectiveBundleSavingsCents(bundle, overrides);
          return (
            <div key={bundle.id} className="bg-white border border-gold-soft/60 rounded-3xl p-8 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-brand mb-3">
                <Sparkles size={18} />
                <h4 className="font-serif text-xl">{meta?.name || bundle.id}</h4>
              </div>
              {meta?.desc && <p className="text-gray-400 text-sm mb-5">{meta.desc}</p>}
              <ul className="space-y-2 mb-6 flex-1">
                {bundle.moduleIds.map(m => (
                  <li key={m} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-brand shrink-0" /> {moduleNames[m]}
                  </li>
                ))}
              </ul>
              <div className="flex items-end justify-between mb-5">
                <span className="font-serif text-3xl text-brand">{formatPriceCents(price, locale)}</span>
                {savings > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                    {dict.savingsLabel} {formatPriceCents(savings, locale)}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleBuy(bundle.id)}
                disabled={buyingId === bundle.id}
                className="inline-flex items-center justify-center gap-2 bg-brand text-white py-3.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-60"
              >
                {buyingId === bundle.id ? <Loader2 size={15} className="animate-spin" /> : null}
                {dict.buyBtn}
              </button>
              {dict.couponToggleLabel && (
                couponVisibleFor === bundle.id ? (
                  <input
                    value={couponCodes[bundle.id] || ""}
                    onChange={e => setCouponCodes(prev => ({ ...prev, [bundle.id]: e.target.value.toUpperCase() }))}
                    placeholder={dict.couponPlaceholder}
                    className="mt-3 text-[11px] text-center border border-gray-200 rounded-full px-4 py-2 tracking-widest uppercase outline-none focus:border-brand w-full"
                  />
                ) : (
                  <button
                    onClick={() => setCouponVisibleFor(bundle.id)}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-brand transition-all"
                  >
                    <Tag size={11} /> {dict.couponToggleLabel}
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
