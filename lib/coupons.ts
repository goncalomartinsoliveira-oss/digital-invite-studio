import type { ModuleId } from "./modules";

// Sistema de cupões fixo no código (mesma filosofia de lib/modules.ts e
// lib/pricing.ts): a tabela `coupons` no Supabase só guarda os dados, toda a
// lógica de validade/desconto vive aqui para o checkout e o painel de
// gestão nunca poderem divergir.
export type DiscountType = "percent" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number; // percent: 1-100 · fixed: cêntimos
  applies_to_module_id: ModuleId | null;
  applies_to_bundle_id: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  active: boolean;
}

export function isCouponValid(coupon: Coupon): boolean {
  if (!coupon.active) return false;
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) return false;
  if (coupon.max_redemptions !== null && coupon.times_redeemed >= coupon.max_redemptions) return false;
  return true;
}

// Um cupão com âmbito (módulo ou bundle) só é válido para essa compra exata
// — nunca desconta o resto do carrinho. Sem âmbito definido, aplica-se a
// tudo o que estiver a ser comprado.
export function couponAppliesToOrder(
  coupon: Coupon,
  order: { bundleId: string | null; moduleIds: ModuleId[] }
): boolean {
  if (coupon.applies_to_bundle_id) return order.bundleId === coupon.applies_to_bundle_id;
  if (coupon.applies_to_module_id) return !order.bundleId && order.moduleIds.includes(coupon.applies_to_module_id);
  return true;
}

export interface DiscountableLineItem {
  moduleId?: ModuleId;
  unitAmountCents: number;
}

// O Stripe recusa sessões de checkout com valor total de 0€ — este é o
// mínimo de segurança para nunca gerar uma sessão inválida com um cupão
// muito agressivo.
export const MIN_CHECKOUT_TOTAL_CENTS = 50;

// Aplica o desconto às linhas elegíveis (o resto fica inalterado). O Stripe
// não aceita valores negativos, por isso o desconto nunca desce abaixo de 0
// por linha.
export function applyCouponDiscount(
  lineItems: DiscountableLineItem[],
  coupon: Coupon
): { amounts: number[]; totalCents: number } {
  const eligible = lineItems.map(item =>
    coupon.applies_to_module_id ? item.moduleId === coupon.applies_to_module_id : true
  );

  let amounts = lineItems.map(i => i.unitAmountCents);

  if (coupon.discount_type === "percent") {
    const pct = Math.min(100, Math.max(0, coupon.discount_value));
    amounts = amounts.map((amt, idx) => (eligible[idx] ? Math.round(amt * (1 - pct / 100)) : amt));
  } else {
    const eligibleTotal = amounts.reduce((sum, amt, idx) => sum + (eligible[idx] ? amt : 0), 0);
    let remaining = Math.max(0, Math.min(coupon.discount_value, eligibleTotal));
    amounts = amounts.map((amt, idx) => {
      if (!eligible[idx] || eligibleTotal === 0) return amt;
      const share = Math.round((amt / eligibleTotal) * coupon.discount_value);
      const applied = Math.min(share, amt, remaining);
      remaining -= applied;
      return amt - applied;
    });
  }

  amounts = amounts.map(a => Math.max(0, a));
  const totalCents = amounts.reduce((sum, a) => sum + a, 0);
  return { amounts, totalCents };
}
