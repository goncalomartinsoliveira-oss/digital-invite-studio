import { ALL_MODULE_IDS, MODULE_DEPENDENCIES, type ModuleId } from "./modules";

// ⚠️ PREÇOS — ajuste à vontade, é só isto que precisa de mudar. Tanto o
// checkout real (Stripe) como a página pública de Pricing lêem estes
// valores, por isso nunca ficam dessincronizados entre si.
// Valores em cêntimos de euro (ex.: 7900 = 79,00€).
// "invite" já inclui "guests_seating" de borla (ver MODULE_DEPENDENCIES em
// modules.ts), daí o preço refletir os dois módulos.
export const MODULE_PRICES_CENTS: Record<ModuleId, number> = {
  save_the_date: 1500,
  invite: 7900,
  guests_seating: 3900,
  photo_sharing: 3500,
  guestbook: 1900,
};

export type Bundle = {
  id: string;
  moduleIds: ModuleId[];
  priceCents: number;
};

// Uma bundle é só um preset de módulos + preço fixo (mais barato que a soma
// à peça). Os nomes/descrições ficam nos dicionários
// (dictionaries/pt.ts, en.ts → "BundleOffers.bundles.<id>"), aqui só o
// "esqueleto" comercial. "convite" + "momentos" cobrem exatamente os
// mesmos 5 módulos que "completo" — dá para vender às duas metades ou
// tudo de uma vez.
export const BUNDLES: Bundle[] = [
  {
    id: "convite",
    moduleIds: ["save_the_date", "invite", "guests_seating"],
    priceCents: 7500,
  },
  {
    id: "momentos",
    moduleIds: ["photo_sharing", "guestbook"],
    priceCents: 4400,
  },
  {
    id: "completo",
    moduleIds: ALL_MODULE_IDS,
    priceCents: 11900,
  },
];

export function moduleFullPriceCents(moduleId: ModuleId): number {
  return MODULE_PRICES_CENTS[moduleId];
}

export function getBundle(bundleId: string): Bundle | undefined {
  return BUNDLES.find(b => b.id === bundleId);
}

// Soma do preço à peça dos módulos incluídos, usada só para mostrar a
// poupança da bundle (nunca é o valor cobrado). Não conta módulos que já
// vêm de borla por dependência de outro módulo do mesmo pacote (ex.: não
// soma "guests_seating" outra vez se "invite" já o inclui), senão a
// poupança apresentada ficaria artificialmente inflacionada.
export function bundleFullPriceCents(bundle: Bundle): number {
  const impliedByOthers = new Set<ModuleId>();
  bundle.moduleIds.forEach(m => {
    (MODULE_DEPENDENCIES[m] || []).forEach(dep => impliedByOthers.add(dep));
  });
  const billableModules = bundle.moduleIds.filter(m => !impliedByOthers.has(m));
  return billableModules.reduce((sum, m) => sum + MODULE_PRICES_CENTS[m], 0);
}

export function bundleSavingsCents(bundle: Bundle): number {
  return Math.max(0, bundleFullPriceCents(bundle) - bundle.priceCents);
}

export function cheapestModulePriceCents(): number {
  return Math.min(...Object.values(MODULE_PRICES_CENTS));
}

// ── Preços diferenciados por parceiro/marca ────────────────────────────
// A grande maioria dos parceiros paga sempre os preços globais acima; só
// quem tiver uma linha em `brand_pricing_overrides` (gerido pelo
// super-admin em Dashboard → Preços) é que tem um valor diferente por
// módulo ou por bundle. Sem override, cai sempre no preço global.
export interface PricingOverrides {
  modules: Partial<Record<ModuleId, number>>;
  bundles: Record<string, number>;
}

interface PricingOverrideRow {
  item_type: "module" | "bundle";
  item_id: string;
  price_cents: number;
}

export const EMPTY_PRICING_OVERRIDES: PricingOverrides = { modules: {}, bundles: {} };

export async function fetchPricingOverrides(sb: any, brandId?: string | null): Promise<PricingOverrides> {
  if (!brandId || brandId === "dis") return { modules: {}, bundles: {} };
  const { data } = await sb
    .from("brand_pricing_overrides")
    .select("item_type, item_id, price_cents")
    .eq("brand_id", brandId);

  const modules: Partial<Record<ModuleId, number>> = {};
  const bundles: Record<string, number> = {};
  ((data as PricingOverrideRow[]) || []).forEach(row => {
    if (row.item_type === "module") modules[row.item_id as ModuleId] = row.price_cents;
    else bundles[row.item_id] = row.price_cents;
  });
  return { modules, bundles };
}

export function effectiveModulePriceCents(moduleId: ModuleId, overrides?: PricingOverrides | null): number {
  return overrides?.modules[moduleId] ?? MODULE_PRICES_CENTS[moduleId];
}

export function effectiveBundlePriceCents(bundle: Bundle, overrides?: PricingOverrides | null): number {
  return overrides?.bundles[bundle.id] ?? bundle.priceCents;
}

// Mesma lógica de bundleFullPriceCents, mas usando os preços por módulo já
// ajustados ao parceiro — senão a poupança apresentada ficava errada para
// quem tem preços diferentes.
export function effectiveBundleFullPriceCents(bundle: Bundle, overrides?: PricingOverrides | null): number {
  const impliedByOthers = new Set<ModuleId>();
  bundle.moduleIds.forEach(m => {
    (MODULE_DEPENDENCIES[m] || []).forEach(dep => impliedByOthers.add(dep));
  });
  const billableModules = bundle.moduleIds.filter(m => !impliedByOthers.has(m));
  return billableModules.reduce((sum, m) => sum + effectiveModulePriceCents(m, overrides), 0);
}

export function effectiveBundleSavingsCents(bundle: Bundle, overrides?: PricingOverrides | null): number {
  return Math.max(0, effectiveBundleFullPriceCents(bundle, overrides) - effectiveBundlePriceCents(bundle, overrides));
}
