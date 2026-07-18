import { ALL_MODULE_IDS, type ModuleId } from "./modules";

// ⚠️ PREÇOS — ajuste à vontade, é só isto que precisa de mudar. Tanto o
// checkout real (Stripe) como a página pública de Pricing lêem estes
// valores, por isso nunca ficam dessincronizados entre si.
// Valores em cêntimos de euro (ex.: 5900 = 59,00€).
export const MODULE_PRICES_CENTS: Record<ModuleId, number> = {
  save_the_date: 1500,
  invite: 5900,
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
    priceCents: 8900,
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

// Soma do preço à peça dos módulos incluídos — usado só para mostrar a
// poupança da bundle (nunca é o valor cobrado).
export function bundleFullPriceCents(bundle: Bundle): number {
  return bundle.moduleIds.reduce((sum, m) => sum + MODULE_PRICES_CENTS[m], 0);
}

export function bundleSavingsCents(bundle: Bundle): number {
  return Math.max(0, bundleFullPriceCents(bundle) - bundle.priceCents);
}

export function cheapestModulePriceCents(): number {
  return Math.min(...Object.values(MODULE_PRICES_CENTS));
}
