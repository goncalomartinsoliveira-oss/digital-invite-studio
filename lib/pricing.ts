import { ALL_MODULE_IDS, type ModuleId } from "./modules";

// ⚠️ PREÇOS DE EXEMPLO — ajuste à vontade, é só isto que precisa de mudar.
// Valores em cêntimos de euro (ex.: 3900 = 39,00€).
export const MODULE_PRICES_CENTS: Record<ModuleId, number> = {
  save_the_date: 900,
  invite: 3900,
  guests_seating: 2900,
  photo_sharing: 2500,
  guestbook: 1500,
};

export type Bundle = {
  id: string;
  moduleIds: ModuleId[];
  priceCents: number;
};

// Uma bundle é só um preset de módulos + preço fixo (mais barato que a soma
// à peça). Os nomes/descrições ficam nos dicionários (dictionaries/pt.ts,
// en.ts → chave "Pricing.bundles.<id>"), aqui só o "esqueleto" comercial.
export const BUNDLES: Bundle[] = [
  {
    id: "essencial",
    moduleIds: ["invite", "guests_seating"],
    priceCents: 5900,
  },
  {
    id: "completo",
    moduleIds: ALL_MODULE_IDS,
    priceCents: 8900,
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
