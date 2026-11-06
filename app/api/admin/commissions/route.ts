import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { commissionDisplayStatus, approvalDate, COMMISSION_APPROVAL_DAYS } from "@/lib/referrals";

// Comissões de recomendação (super admin): todas as vendas com comissão, com o
// estado (pendente → aprovada aos 14 dias → paga, ou cancelada), e a ação de
// marcar como pagas as aprovadas de um parceiro (pagamento mensal).

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: pays, error } = await supabaseAdmin
    .from("payments")
    .select("id, invitation_id, amount_cents, status, paid_at, referral_brand_id, commission_pct, commission_cents, commission_status, commission_paid_at")
    .not("referral_brand_id", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (pays as any[]) || [];
  const brandIds = [...new Set(rows.map(r => r.referral_brand_id))];
  const invIds = [...new Set(rows.map(r => r.invitation_id))];
  const [{ data: brands }, { data: accs }, { data: invs }] = await Promise.all([
    brandIds.length ? supabaseAdmin.from("brands").select("id, name").in("id", brandIds) : Promise.resolve({ data: [] as any[] }),
    brandIds.length ? supabaseAdmin.from("partner_accounts").select("brand_id, billing_name, billing_nif, billing_iban").in("brand_id", brandIds) : Promise.resolve({ data: [] as any[] }),
    invIds.length ? supabaseAdmin.from("invitations").select("id, slug, groom_name, bride_name, event_date").in("id", invIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const nameOf = new Map(((brands as any[]) || []).map(b => [b.id, b.name]));
  const billOf = new Map(((accs as any[]) || []).map(a => [a.brand_id, a]));
  const invOf = new Map(((invs as any[]) || []).map(i => [i.id, i]));

  const commissions = rows.map(r => {
    const inv = invOf.get(r.invitation_id);
    return {
      id: r.id,
      brandId: r.referral_brand_id,
      brandName: nameOf.get(r.referral_brand_id) || r.referral_brand_id,
      event: inv ? (inv.groom_name && inv.bride_name ? `${inv.groom_name} & ${inv.bride_name}` : inv.slug) : r.invitation_id,
      eventDate: inv?.event_date ?? null,
      paidAt: r.paid_at,
      amountCents: r.amount_cents,
      commissionPct: Number(r.commission_pct),
      commissionCents: r.commission_cents,
      status: commissionDisplayStatus(r),
      approvesAt: approvalDate(r.paid_at),
      paidOutAt: r.commission_paid_at,
    };
  }).sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt)));

  const partners = brandIds.map(id => {
    const mine = commissions.filter(c => c.brandId === id);
    const tot = (st: string) => mine.filter(c => c.status === st).reduce((s, c) => s + (c.commissionCents || 0), 0);
    const bill = billOf.get(id);
    return {
      brandId: id, brandName: nameOf.get(id) || id,
      pending: tot("pending"), approved: tot("approved"), paid: tot("paid"),
      billing: { name: bill?.billing_name ?? null, nif: bill?.billing_nif ?? null, iban: bill?.billing_iban ?? null },
    };
  }).sort((a, b) => b.approved - a.approved);

  return NextResponse.json({ commissions, partners });
}

// { action: "markPaid", brandId } → as comissões aprovadas desse parceiro
// (pagamento confirmado há pelo menos 14 dias) passam a "paga".
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => ({}));
  if (body?.action !== "markPaid" || typeof body?.brandId !== "string") return NextResponse.json({ error: "invalid" }, { status: 400 });

  const cutoff = new Date(Date.now() - COMMISSION_APPROVAL_DAYS * 86400000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("payments")
    .update({ commission_status: "paid", commission_paid_at: new Date().toISOString() })
    .eq("referral_brand_id", body.brandId)
    .in("commission_status", ["pending", "approved"])
    .eq("status", "paid")
    .lte("paid_at", cutoff)
    .select("id, commission_cents");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data as any[]) || [];
  return NextResponse.json({ count: rows.length, totalCents: rows.reduce((s, r) => s + (r.commission_cents || 0), 0) });
}
