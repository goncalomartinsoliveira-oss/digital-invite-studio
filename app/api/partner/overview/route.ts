import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BRANDS } from "@/lib/brands";
import { quoteFullPlan, type PartnerAccount } from "@/lib/partnerPricing";
import { commissionDisplayStatus, approvalDate } from "@/lib/referrals";

// Área "Parceiro" (lista de eventos): tudo o que um parceiro precisa de ver,
// lido com a service_role mas só para a marca de que a pessoa é membro.
// Nas recomendações não vão nomes nem convidados — só a data do casamento,
// o valor pago e a comissão (RGPD: o parceiro não é parte desse evento).
export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: u } = await supabaseAdmin.auth.getUser(token);
  const email = u?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const wanted = req.nextUrl.searchParams.get("brand");
  const { data: mems } = await supabaseAdmin.from("brand_members").select("brand_id, role").eq("user_email", email);
  const membership = ((mems as any[]) || []).find(m => m.brand_id !== "dis" && (!wanted || m.brand_id === wanted));
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const brandId: string = membership.brand_id;

  const [{ data: brandRow }, { data: acc }, { data: refPays }, { data: ownEvents }, { data: referredEvents }] = await Promise.all([
    supabaseAdmin.from("brands").select("id, name, logo_url, domain, planner_plan").eq("id", brandId).maybeSingle(),
    supabaseAdmin.from("partner_accounts").select("*").eq("brand_id", brandId).maybeSingle(),
    supabaseAdmin.from("payments").select("id, invitation_id, amount_cents, status, paid_at, commission_pct, commission_cents, commission_status, commission_paid_at").eq("referral_brand_id", brandId),
    supabaseAdmin.from("invitations").select("id, slug, groom_name, bride_name, event_date, unlocked_modules, paid_by").eq("brand_id", brandId),
    supabaseAdmin.from("invitations").select("id, event_date, unlocked_modules").eq("referred_by_brand_id", brandId),
  ]);
  const account = acc as PartnerAccount | null;

  const dateOf = new Map(((referredEvents as any[]) || []).map(e => [e.id, e.event_date]));
  const referrals = ((refPays as any[]) || [])
    .filter(p => p.commission_status)
    .map(p => ({
      id: p.id,
      eventDate: dateOf.get(p.invitation_id) ?? null,
      paidAt: p.paid_at,
      amountCents: p.amount_cents,
      commissionPct: Number(p.commission_pct),
      commissionCents: p.commission_cents,
      status: commissionDisplayStatus(p),
      approvesAt: approvalDate(p.paid_at),
      paidOutAt: p.commission_paid_at,
    }))
    .sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt)));
  const sum = (st: string) => referrals.filter(r => r.status === st).reduce((s, r) => s + (r.commissionCents || 0), 0);
  const paidInvitationIds = new Set(((refPays as any[]) || []).map(p => p.invitation_id));
  const referredNotPaid = ((referredEvents as any[]) || []).filter(e => !paidInvitationIds.has(e.id)).length;

  // Eventos da marca e o que custou publicá-los.
  const own = (ownEvents as any[]) || [];
  const { data: ownPays } = own.length
    ? await supabaseAdmin.from("payments").select("invitation_id, amount_cents, status, paid_at").in("invitation_id", own.map(e => e.id))
    : { data: [] as any[] };
  const paysBy = new Map<string, any[]>();
  ((ownPays as any[]) || []).forEach(p => paysBy.set(p.invitation_id, [...(paysBy.get(p.invitation_id) || []), p]));
  const events = own.map(e => ({
    id: e.id, slug: e.slug,
    name: e.groom_name && e.bride_name ? `${e.groom_name} & ${e.bride_name}` : e.slug,
    eventDate: e.event_date,
    published: (e.unlocked_modules || []).includes("invite"),
    payer: e.paid_by === "couple" ? "couple" : "partner",
    paidCents: (paysBy.get(e.id) || []).filter(p => p.status === "paid").reduce((s, p) => s + (p.amount_cents || 0), 0),
  })).sort((a, b) => String(a.eventDate).localeCompare(String(b.eventDate)));
  const partnerPaidCount = events.filter(e => e.published && e.payer === "partner").length;

  // Quanto custa o próximo casamento pago pelo parceiro (o mesmo cálculo do checkout).
  const next = account?.partner_price_enabled
    ? await quoteFullPlan(supabaseAdmin, { id: "00000000-0000-0000-0000-000000000000", brand_id: brandId, paid_by: "partner", unlocked_modules: [] }, email)
    : null;

  return NextResponse.json({
    // Marcas de código (lib/brands.ts) têm nome, logótipo e domínio no código.
    brand: { id: brandId, name: brandRow?.name || BRANDS[brandId]?.name || brandId, logo: brandRow?.logo_url || BRANDS[brandId]?.logo || null, domain: brandRow?.domain || BRANDS[brandId]?.domains[0] || null, planning: !!brandRow?.planner_plan },
    role: membership.role,
    features: {
      referral: !!account?.referral_enabled,
      partnerPrice: !!account?.partner_price_enabled,
      planning: !!brandRow?.planner_plan,
      ownBrand: !!(brandRow?.logo_url || brandRow?.domain || BRANDS[brandId]),
    },
    terms: account ? {
      commissionPct: Number(account.commission_pct),
      referralCode: account.referral_code,
      partnerPriceCents: account.partner_price_cents,
      volumePriceCents: account.partner_volume_price_cents,
      volumeThreshold: account.partner_volume_threshold,
      nextPriceCents: next?.cents ?? null,
      nextIsVolume: !!next?.volume,
      billing: { name: account.billing_name, nif: account.billing_nif, hasIban: !!account.billing_iban },
    } : null,
    referrals,
    referralTotals: { pending: sum("pending"), approved: sum("approved"), paid: sum("paid"), referredNotPaid },
    events,
    partnerPaidCount,
  });
}
