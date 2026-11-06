import type { SupabaseClient } from "@supabase/supabase-js";
import { FULL_PLAN, fullPlanPriceFor } from "./pricing";

// Quanto custa publicar (Plano Completo) um evento, e quem o pode pagar.
// Só no servidor (service_role): lê partner_accounts, que o casal não vê.
//
//   Evento normal (marca DIS) ............ noivos, preço normal.
//   Evento de parceiro, paid_by 'couple' .. noivos, preço normal.
//   Evento de parceiro, paid_by vazio ou
//   'partner' ............................ só a equipa do parceiro (ou super
//                                          admin) paga, ao preço de parceiro se
//                                          estiver ligado; a partir do N.º
//                                          casamento pago pelo parceiro (N =
//                                          partner_volume_threshold, contado
//                                          desde sempre), ao preço de volume.
// Quem já tinha módulos à peça paga só a diferença (fullPlanPriceFor).

export type PartnerAccount = {
  brand_id: string;
  referral_enabled: boolean;
  commission_pct: number;
  referral_code: string | null;
  partner_price_enabled: boolean;
  partner_price_cents: number;
  partner_volume_price_cents: number;
  partner_volume_threshold: number;
  billing_name?: string | null;
  billing_nif?: string | null;
  billing_iban?: string | null;
  notes?: string | null;
};

export const PARTNER_DEFAULTS = {
  commission_pct: 15,
  partner_price_cents: 7900,
  partner_volume_price_cents: 6900,
  partner_volume_threshold: 10,
};

export type PlanQuote = {
  cents: number;
  isUpgrade: boolean;
  payer: "couple" | "partner";
  canBuy: boolean;            // quem pede pode pagar este evento
  partnerPrice: boolean;      // está a ser aplicado o preço de parceiro
  volume: boolean;            // ... e é o de volume
  paidCount?: number;         // casamentos já pagos pelo parceiro
  threshold?: number;
  listCents: number;          // preço normal, para referência
};

export function isPartnerBrandId(brandId?: string | null): brandId is string {
  return !!brandId && brandId !== "dis";
}

export async function fetchPartnerAccount(sb: SupabaseClient, brandId?: string | null): Promise<PartnerAccount | null> {
  if (!isPartnerBrandId(brandId)) return null;
  const { data, error } = await sb.from("partner_accounts").select("*").eq("brand_id", brandId).maybeSingle();
  if (error) return null; // migração 0015 por aplicar → como se não houvesse condições próprias
  return (data as PartnerAccount) || null;
}

// Casamentos do parceiro já publicados e pagos por ele (sem contar o atual).
async function partnerPaidCount(sb: SupabaseClient, brandId: string, excludeId: string): Promise<number> {
  const { data } = await sb.from("invitations").select("id, unlocked_modules, paid_by").eq("brand_id", brandId);
  return ((data as any[]) || []).filter(i =>
    i.id !== excludeId && (i.unlocked_modules || []).includes("invite") && i.paid_by !== "couple"
  ).length;
}

// O pedido vem de alguém da equipa do parceiro (ou de um super admin)?
export async function isPartnerStaff(sb: SupabaseClient, brandId: string, email?: string | null): Promise<boolean> {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  const [{ data: sa }, { data: m }] = await Promise.all([
    sb.from("super_admins").select("user_email").eq("user_email", e).maybeSingle(),
    sb.from("brand_members").select("role").eq("brand_id", brandId).eq("user_email", e).maybeSingle(),
  ]);
  return !!sa || !!m;
}

export async function quoteFullPlan(
  sb: SupabaseClient,
  invite: { id: string; brand_id?: string | null; paid_by?: string | null; unlocked_modules?: string[] | null },
  buyerEmail?: string | null
): Promise<PlanQuote> {
  const unlocked = invite.unlocked_modules || [];
  const listCents = FULL_PLAN.priceCents;

  if (!isPartnerBrandId(invite.brand_id) || invite.paid_by === "couple") {
    const { cents, isUpgrade } = fullPlanPriceFor(unlocked, null);
    return { cents, isUpgrade, payer: "couple", canBuy: true, partnerPrice: false, volume: false, listCents };
  }

  const brandId = invite.brand_id;
  const [account, staff] = await Promise.all([fetchPartnerAccount(sb, brandId), isPartnerStaff(sb, brandId, buyerEmail)]);

  if (!account?.partner_price_enabled) {
    const { cents, isUpgrade } = fullPlanPriceFor(unlocked, null);
    return { cents, isUpgrade, payer: "partner", canBuy: staff, partnerPrice: false, volume: false, listCents };
  }

  const paidCount = await partnerPaidCount(sb, brandId, invite.id);
  const threshold = account.partner_volume_threshold || PARTNER_DEFAULTS.partner_volume_threshold;
  const volume = paidCount + 1 >= threshold;
  const planCents = volume ? account.partner_volume_price_cents : account.partner_price_cents;
  const { cents, isUpgrade } = fullPlanPriceFor(unlocked, { modules: {}, bundles: { [FULL_PLAN.id]: planCents } });
  return { cents, isUpgrade, payer: "partner", canBuy: staff, partnerPrice: true, volume, paidCount, threshold, listCents };
}
