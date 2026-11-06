import { ALL_MODULE_IDS, MODULE_DEPENDENCIES, type ModuleId } from "./modules";

// ⚠️ PREÇOS — é só isto que precisa de mudar. O checkout real (Stripe), a
// página pública de Preços e os ecrãs de compra do painel leem estes valores,
// por isso nunca ficam dessincronizados entre si. Valores em cêntimos de euro
// com IVA incluído (ex.: 11900 = 119,00 €).
//
// Modelo (nov. 2026): um só produto para os casais, o PLANO COMPLETO, que
// desbloqueia todos os módulos do evento com um pagamento único. Os módulos
// continuam a existir por dentro (unlocked_modules, separadores bloqueados),
// mas já não se vendem à peça.

// Preço normal do Plano Completo. Enquanto durar o lançamento aparece riscado
// ao lado do preço de lançamento (FULL_PLAN.priceCents). Para terminar o
// lançamento, pôr FULL_PLAN.priceCents igual a este valor: o riscado some.
export const FULL_PLAN_LIST_PRICE_CENTS = 14900;

// Convite à medida (desenho exclusivo, com o Plano Completo incluído).
// Não tem checkout: é "a partir de", com orçamento pedido pelo contacto.
export const BESPOKE_FROM_CENTS = 69900;

// Valor de cada módulo, usado só para descontar no Plano Completo o que um
// evento já tinha comprado à peça antes da mudança (ver fullPlanPriceFor).
// "invite" inclui "guests_seating" (MODULE_DEPENDENCIES em modules.ts).
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

export const FULL_PLAN_ID = "completo";

export const FULL_PLAN: Bundle = {
  id: FULL_PLAN_ID,
  moduleIds: ALL_MODULE_IDS,
  priceCents: 11900, // preço de lançamento; normal = FULL_PLAN_LIST_PRICE_CENTS
};

// Só o Plano Completo está à venda. Os ids antigos ("convite", "momentos")
// ainda podem aparecer em pagamentos e cupões antigos, mas já não se vendem.
export const BUNDLES: Bundle[] = [FULL_PLAN];

export function getBundle(bundleId: string): Bundle | undefined {
  return BUNDLES.find(b => b.id === bundleId);
}

export function isLaunchPrice(): boolean {
  return FULL_PLAN.priceCents < FULL_PLAN_LIST_PRICE_CENTS;
}

// Módulos que contam para desconto: os comprados, sem os que vêm de borla por
// dependência de outro também comprado (ex.: "guests_seating" com "invite").
function billableModules(moduleIds: ModuleId[]): ModuleId[] {
  const implied = new Set<ModuleId>();
  moduleIds.forEach(m => (MODULE_DEPENDENCIES[m] || []).forEach(dep => implied.add(dep)));
  return moduleIds.filter(m => !implied.has(m));
}

// Quanto custa o Plano Completo para ESTE evento.
//   - Sem nada comprado: o preço do plano (com o preço do parceiro, se houver).
//   - Com módulos comprados à peça antes da mudança: paga só a diferença —
//     o preço do plano menos o valor do que já tem, e nunca mais do que os
//     módulos que lhe faltam valeriam à peça.
//   - Com tudo desbloqueado: 0 (nada a comprar).
export function fullPlanPriceFor(unlocked: string[], overrides?: PricingOverrides | null): { cents: number; isUpgrade: boolean } {
  const owned = ALL_MODULE_IDS.filter(m => unlocked.includes(m));
  const missing = ALL_MODULE_IDS.filter(m => !unlocked.includes(m));
  const planCents = effectiveBundlePriceCents(FULL_PLAN, overrides);
  if (missing.length === 0) return { cents: 0, isUpgrade: owned.length > 0 };
  if (owned.length === 0) return { cents: planCents, isUpgrade: false };
  const credit = billableModules(owned).reduce((sum, m) => sum + effectiveModulePriceCents(m, overrides), 0);
  // Os que faltam "à peça", sem contar dependências que já estão desbloqueadas.
  const missingValue = billableModules(missing).reduce((sum, m) => sum + effectiveModulePriceCents(m, overrides), 0);
  return { cents: Math.max(0, Math.min(planCents - credit, missingValue)), isUpgrade: true };
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
