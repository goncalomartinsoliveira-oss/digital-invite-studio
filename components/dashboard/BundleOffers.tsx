"use client";
import { useState } from "react";
import { Check, Loader2, Sparkles, Tag } from "lucide-react";
import { FULL_PLAN, FULL_PLAN_LIST_PRICE_CENTS, fullPlanPriceFor, isLaunchPrice, type PricingOverrides } from "@/lib/pricing";
import { startBundleCheckout, formatPriceCents } from "@/lib/checkout";
import { ALL_MODULE_IDS, type ModuleId } from "@/lib/modules";

interface BundleOffersDict {
  title: string;
  subtitle: string;
  buyBtn: string;
  launchLabel: string;
  upgradeNote: string;
  oneTime: string;
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
  isPartnerBrand?: boolean;
  moduleNames: Record<ModuleId, string>;
  overrides?: PricingOverrides;
  dict: BundleOffersDict;
}

// Cartão do Plano Completo na página inicial do painel — o único produto à
// venda (lib/pricing.ts). Desaparece quando o evento já tem tudo. Quem já
// comprou módulos à peça vê o preço da diferença (fullPlanPriceFor).
// Eventos de parceiros não têm checkout self-service (ver dashboard/[slug]).
export default function BundleOffers({ invitationId, slug, locale, unlockedModules, isSuperAdmin, isPartnerBrand, moduleNames, overrides, dict }: BundleOffersProps) {
  const [buying, setBuying] = useState(false);
  const [couponVisible, setCouponVisible] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  if (isSuperAdmin || isPartnerBrand) return null;
  if (ALL_MODULE_IDS.every(m => unlockedModules.includes(m))) return null;

  const { cents, isUpgrade } = fullPlanPriceFor(unlockedModules, overrides);
  const hasOverride = overrides?.bundles[FULL_PLAN.id] !== undefined;
  const showLaunch = !isUpgrade && !hasOverride && isLaunchPrice();
  const meta = dict.bundles[FULL_PLAN.id];

  const handleBuy = async () => {
    setBuying(true);
    try {
      await startBundleCheckout({ invitationId, slug, locale, bundleId: FULL_PLAN.id, couponCode: couponCode.trim() || undefined });
    } catch (err: any) {
      alert(err.message || "Erro ao iniciar o pagamento.");
      setBuying(false);
    }
  };

  return (
    <div className="mt-14">
      <div className="text-center mb-8">
        <h3 className="font-serif text-2xl text-ink">{dict.title}</h3>
        <p className="text-gray-400 text-sm mt-1">{dict.subtitle}</p>
      </div>
      <div className="max-w-xl mx-auto bg-white border-2 border-brand/80 rounded-3xl p-8 shadow-lg flex flex-col">
        <div className="flex items-center gap-2 text-brand mb-3">
          <Sparkles size={18} />
          <h4 className="font-serif text-2xl">{meta?.name || FULL_PLAN.id}</h4>
        </div>
        {meta?.desc && <p className="text-gray-500 text-sm mb-5">{meta.desc}</p>}
        <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2 mb-6">
          {ALL_MODULE_IDS.map(m => (
            <li key={m} className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={14} className="text-brand shrink-0" /> {moduleNames[m]}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1 mb-1">
          {showLaunch && <span className="font-serif text-xl text-gray-400 line-through">{formatPriceCents(FULL_PLAN_LIST_PRICE_CENTS, locale)}</span>}
          <span className="font-serif text-4xl text-brand">{formatPriceCents(cents, locale)}</span>
          {showLaunch && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-2.5 py-1 rounded-md mb-1.5">{dict.launchLabel}</span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mb-5">{isUpgrade ? dict.upgradeNote : dict.oneTime}</p>
        <button
          onClick={handleBuy}
          disabled={buying}
          className="inline-flex items-center justify-center gap-2 bg-brand text-white py-3.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-60"
        >
          {buying ? <Loader2 size={15} className="animate-spin" /> : null}
          {dict.buyBtn}
        </button>
        {dict.couponToggleLabel && (
          couponVisible ? (
            <input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder={dict.couponPlaceholder}
              className="mt-3 text-[11px] text-center border border-gray-200 rounded-full px-4 py-2 tracking-widest uppercase outline-none focus:border-brand w-full"
            />
          ) : (
            <button
              onClick={() => setCouponVisible(true)}
              className="mt-3 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-brand transition-all"
            >
              <Tag size={11} /> {dict.couponToggleLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}
