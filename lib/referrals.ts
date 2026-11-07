import type { SupabaseClient } from "@supabase/supabase-js";
import type { PartnerAccount } from "./partnerPricing";

// Programa de parceiros — recomendações (fase B). Só no servidor.
//
// Atribuição: o link /r/CODIGO guarda o código num cookie durante 90 dias;
// quando os noivos criam (ou abrem) o evento, ou ao pagar, o evento fica com
// referred_by_brand_id. Um código escrito no checkout ganha ao cookie.
// Um link ou código nunca liga um evento ao próprio parceiro (marca do evento =
// parceiro, ou dono do evento é membro do parceiro): esses eventos já são dele.
//
// Comissão: só quando pagam os noivos, ao preço normal. Num evento do próprio
// parceiro com "Quem paga" = os noivos, a comissão é desse parceiro; num evento
// direto, de quem o recomendou (ver api/stripe/webhook). Percentagem do parceiro gravada no
// pagamento, calculada sobre o valor sem IVA; "pendente" até passarem 14 dias
// (prazo de reembolso), depois "aprovada"; o super admin marca como "paga".
// Um reembolso cancela a comissão ainda não paga.

export const REF_COOKIE = "dis_ref";
export const REF_COOKIE_DAYS = 90;
export const COMMISSION_APPROVAL_DAYS = 14;
export const VAT_RATE = 0.23;

export type CommissionStatus = "pending" | "approved" | "paid" | "cancelled";

export function normalizeCode(code?: string | null): string {
  return (code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export async function findPartnerByCode(sb: SupabaseClient, code?: string | null): Promise<PartnerAccount | null> {
  const c = normalizeCode(code);
  if (!c) return null;
  const { data } = await sb.from("partner_accounts").select("*").eq("referral_code", c).maybeSingle();
  const acc = data as PartnerAccount | null;
  return acc && acc.referral_enabled ? acc : null;
}

// Pode este evento ser atribuído a este parceiro?
export async function canAttribute(sb: SupabaseClient, invite: { brand_id?: string | null; user_email?: string | null }, brandId: string): Promise<boolean> {
  if (invite.brand_id === brandId) return false;
  const owner = (invite.user_email || "").trim().toLowerCase();
  if (!owner) return true;
  const { data } = await sb.from("brand_members").select("role").eq("brand_id", brandId).eq("user_email", owner).maybeSingle();
  return !data;
}

// Grava a recomendação no evento. Sem `override`, só se ainda não tiver uma.
export async function attachReferral(
  sb: SupabaseClient,
  invite: { id: string; brand_id?: string | null; user_email?: string | null; referred_by_brand_id?: string | null },
  code: string | null | undefined,
  opts: { override?: boolean } = {}
): Promise<string | null> {
  if (invite.referred_by_brand_id && !opts.override) return invite.referred_by_brand_id;
  const partner = await findPartnerByCode(sb, code);
  if (!partner) return invite.referred_by_brand_id ?? null;
  if (!(await canAttribute(sb, invite, partner.brand_id))) return invite.referred_by_brand_id ?? null;
  if (invite.referred_by_brand_id === partner.brand_id) return partner.brand_id;
  await sb.from("invitations").update({ referred_by_brand_id: partner.brand_id, referred_at: new Date().toISOString() }).eq("id", invite.id);
  return partner.brand_id;
}

export function commissionCents(amountPaidCents: number, pct: number): number {
  const net = amountPaidCents / (1 + VAT_RATE);
  return Math.round((net * pct) / 100);
}

// Estado mostrado: "pendente" passa a "aprovada" quando passam 14 dias.
export function commissionDisplayStatus(row: { commission_status?: string | null; paid_at?: string | null }, now: Date = new Date()): CommissionStatus | null {
  const s = row.commission_status as CommissionStatus | null | undefined;
  if (!s) return null;
  if (s !== "pending") return s;
  if (!row.paid_at) return "pending";
  const age = now.getTime() - new Date(row.paid_at).getTime();
  return age >= COMMISSION_APPROVAL_DAYS * 86400000 ? "approved" : "pending";
}

export function approvalDate(paidAt?: string | null): string | null {
  if (!paidAt) return null;
  return new Date(new Date(paidAt).getTime() + COMMISSION_APPROVAL_DAYS * 86400000).toISOString();
}
