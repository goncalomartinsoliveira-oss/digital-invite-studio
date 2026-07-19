import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BRANDS } from "@/lib/brands";

// Visão de negócio para super-admins: receita e portfólio por parceiro,
// juntando invitations + payments (só possível com a service_role key,
// porque cada parceiro só pode ler os seus próprios dados por RLS).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const email = userData?.user?.email;
  if (userError || !email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: sa } = await supabaseAdmin
    .from("super_admins")
    .select("user_email")
    .eq("user_email", email)
    .maybeSingle();
  if (!sa) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const [{ data: invitations, error: invError }, { data: payments, error: payError }, { data: dbBrands, error: brandsError }] =
    await Promise.all([
      supabaseAdmin.from("invitations").select("id, brand_id, unlocked_modules, created_at"),
      supabaseAdmin.from("payments").select("invitation_id, amount_cents, amount_refunded_cents, status, paid_at, created_at"),
      supabaseAdmin.from("brands").select("id, name"),
    ]);

  if (invError || payError || brandsError) {
    console.error("[business-overview]", invError || payError || brandsError);
    return NextResponse.json({ error: "Erro ao carregar dados." }, { status: 500 });
  }

  const invBrandMap: Record<string, string> = {};
  const invByBrand: Record<string, { events: number; active: number }> = {};
  (invitations || []).forEach((inv: any) => {
    const bId = inv.brand_id || "dis";
    invBrandMap[inv.id] = bId;
    if (!invByBrand[bId]) invByBrand[bId] = { events: 0, active: 0 };
    invByBrand[bId].events++;
    if ((inv.unlocked_modules || []).length > 0) invByBrand[bId].active++;
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalRevenueCents = 0;
  let monthRevenueCents = 0;
  const revenueByBrand: Record<string, number> = {};
  const lastPaymentByBrand: Record<string, string> = {};

  (payments || []).forEach((p: any) => {
    const net = (p.amount_cents || 0) - (p.amount_refunded_cents || 0);
    if (net <= 0) return;
    totalRevenueCents += net;
    const paidAt = p.paid_at || p.created_at;
    if (paidAt && new Date(paidAt) >= monthStart) monthRevenueCents += net;

    const bId = invBrandMap[p.invitation_id] || "dis";
    revenueByBrand[bId] = (revenueByBrand[bId] || 0) + net;
    if (paidAt && (!lastPaymentByBrand[bId] || new Date(paidAt) > new Date(lastPaymentByBrand[bId]))) {
      lastPaymentByBrand[bId] = paidAt;
    }
  });

  const brandNames: Record<string, string> = { dis: "Digital Invite Studio (direto)" };
  Object.values(BRANDS).forEach(b => { brandNames[b.id] = b.name; });
  (dbBrands || []).forEach((b: any) => { brandNames[b.id] = b.name; });

  const brandIds = new Set([...Object.keys(invByBrand), ...Object.keys(revenueByBrand)]);
  const partners = Array.from(brandIds)
    .map(id => ({
      id,
      name: brandNames[id] || id,
      events: invByBrand[id]?.events || 0,
      active: invByBrand[id]?.active || 0,
      revenueCents: revenueByBrand[id] || 0,
      lastPaymentAt: lastPaymentByBrand[id] || null,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  const totalEvents = (invitations || []).length;
  const activeEvents = (invitations || []).filter((inv: any) => (inv.unlocked_modules || []).length > 0).length;
  const totalPartners = partners.filter(p => p.id !== "dis").length;

  return NextResponse.json({
    kpis: { totalRevenueCents, monthRevenueCents, totalEvents, activeEvents, totalPartners },
    partners,
  });
}
