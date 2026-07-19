import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BRANDS } from "@/lib/brands";

// Visão de negócio para super-admins: receita e portfólio por parceiro,
// juntando invitations + payments (só possível com a service_role key,
// porque cada parceiro só pode ler os seus próprios dados por RLS).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  // Validar o token do utilizador com a anon key (não a service_role) — é o
  // padrão suportado pelo Supabase para confirmar quem está por trás de um
  // pedido; os dados privilegiados só são lidos depois, via supabaseAdmin.
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: userData, error: userError } = await authClient.auth.getUser();
  const email = userData?.user?.email;
  if (userError || !email) {
    console.error("[business-overview] Falha a validar sessão:", userError?.message);
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
      supabaseAdmin
        .from("invitations")
        .select("id, slug, brand_id, unlocked_modules, created_at, event_date, groom_name, bride_name, user_email"),
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
  const revenueByInvitation: Record<string, number> = {};
  const paymentsCountByInvitation: Record<string, number> = {};
  const lastPaymentByInvitation: Record<string, string> = {};

  (payments || []).forEach((p: any) => {
    paymentsCountByInvitation[p.invitation_id] = (paymentsCountByInvitation[p.invitation_id] || 0) + 1;
    const paidAt = p.paid_at || p.created_at;
    if (paidAt && (!lastPaymentByInvitation[p.invitation_id] || new Date(paidAt) > new Date(lastPaymentByInvitation[p.invitation_id]))) {
      lastPaymentByInvitation[p.invitation_id] = paidAt;
    }

    const net = (p.amount_cents || 0) - (p.amount_refunded_cents || 0);
    if (net <= 0) return;
    totalRevenueCents += net;
    if (paidAt && new Date(paidAt) >= monthStart) monthRevenueCents += net;

    revenueByInvitation[p.invitation_id] = (revenueByInvitation[p.invitation_id] || 0) + net;

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

  const events = (invitations || []).map((inv: any) => ({
    id: inv.id,
    slug: inv.slug,
    groomName: inv.groom_name,
    brideName: inv.bride_name,
    userEmail: inv.user_email,
    brandId: inv.brand_id || "dis",
    createdAt: inv.created_at,
    eventDate: inv.event_date,
    unlockedModules: inv.unlocked_modules || [],
    revenueCents: revenueByInvitation[inv.id] || 0,
    paymentsCount: paymentsCountByInvitation[inv.id] || 0,
    lastPaymentAt: lastPaymentByInvitation[inv.id] || null,
  }));

  return NextResponse.json({
    kpis: { totalRevenueCents, monthRevenueCents, totalEvents, activeEvents, totalPartners },
    partners,
    events,
  });
}
