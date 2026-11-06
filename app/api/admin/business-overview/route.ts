import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BRANDS } from "@/lib/brands";
import { isArchivedEvent, isExpiredEvent } from "@/lib/eventArchive";
import { commissionDisplayStatus } from "@/lib/referrals";

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
//
// É a "Visão geral" do super admin: números do negócio, receita por mês,
// comissões por pagar, parceiros ativos e a lista "Para tratar".
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

  // super_admins guarda o email normalizado (trim+minúsculas) — ver
  // InternalTeamView e BrandMembersPanel; comparar com o email em bruto da sessão falha
  // sempre que a capitalização não bater certo.
  const { data: sa } = await supabaseAdmin
    .from("super_admins")
    .select("user_email")
    .eq("user_email", email.trim().toLowerCase())
    .maybeSingle();
  if (!sa) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const [{ data: invitations, error: invError }, { data: payments, error: payError }, { data: dbBrands, error: brandsError }, { data: accounts }] =
    await Promise.all([
      supabaseAdmin
        .from("invitations")
        .select("id, slug, brand_id, unlocked_modules, created_at, event_date, groom_name, bride_name, user_email, expires_at, content_purged_at, expiry_notice_sent_at"),
      supabaseAdmin.from("payments").select("invitation_id, amount_cents, amount_refunded_cents, status, paid_at, created_at, referral_brand_id, commission_cents, commission_status"),
      supabaseAdmin.from("brands").select("id, name, planner_plan"),
      // Sem a migração 0015 esta leitura falha e fica vazia — não é fatal.
      supabaseAdmin.from("partner_accounts").select("brand_id, referral_enabled, partner_price_enabled, billing_nif, billing_iban"),
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

  // Receita dos últimos 6 meses (o mês atual incluído).
  const revenueByMonth: { month: string; cents: number; payments: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenueByMonth.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, cents: 0, payments: 0 });
  }
  (payments || []).forEach((p: any) => {
    const net = (p.amount_cents || 0) - (p.amount_refunded_cents || 0);
    const at = p.paid_at || p.created_at;
    if (net <= 0 || !at) return;
    const row = revenueByMonth.find(r => r.month === String(at).slice(0, 7));
    if (row) { row.cents += net; row.payments++; }
  });

  // Comissões: a pagar (aprovadas) e pendentes (ainda nos 14 dias).
  let commissionsToPayCents = 0;
  let commissionsPendingCents = 0;
  const toPayByBrand: Record<string, number> = {};
  (payments || []).forEach((p: any) => {
    if (!p.referral_brand_id || p.status !== "paid") return;
    const st = commissionDisplayStatus(p, now);
    if (st === "approved") { commissionsToPayCents += p.commission_cents || 0; toPayByBrand[p.referral_brand_id] = (toPayByBrand[p.referral_brand_id] || 0) + (p.commission_cents || 0); }
    if (st === "pending") commissionsPendingCents += p.commission_cents || 0;
  });
  const accountByBrand = new Map(((accounts as any[]) || []).map(a => [a.brand_id, a]));
  const partnersMissingBilling = Object.keys(toPayByBrand).filter(id => {
    const a = accountByBrand.get(id);
    return !a?.billing_nif || !a?.billing_iban;
  }).length;

  // Parceiros ativos: com pelo menos uma funcionalidade ligada.
  const active = new Set<string>();
  ((accounts as any[]) || []).forEach(a => { if (a.referral_enabled || a.partner_price_enabled) active.add(a.brand_id); });
  (dbBrands || []).forEach((b: any) => { if (b.planner_plan) active.add(b.id); });

  // Para tratar: fim de prazo (Eventos › Arquivados).
  const archived = (invitations || []).filter((inv: any) => isArchivedEvent(inv, now));
  const noticesToSend = archived.filter((inv: any) => !isExpiredEvent(inv, now) && !inv.expiry_notice_sent_at && inv.user_email).length;
  const contentToDelete = archived.filter((inv: any) => isExpiredEvent(inv, now) && !inv.content_purged_at).length;

  const totalEvents = (invitations || []).length;
  const publishedEvents = (invitations || []).filter((inv: any) => (inv.unlocked_modules || []).includes("invite")).length;
  const eventsThisMonth = (invitations || []).filter((inv: any) => inv.created_at && new Date(inv.created_at) >= monthStart).length;
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
    kpis: { totalRevenueCents, monthRevenueCents, totalEvents, activeEvents, totalPartners, publishedEvents, eventsThisMonth, activePartners: active.size },
    revenueByMonth,
    commissions: { toPayCents: commissionsToPayCents, pendingCents: commissionsPendingCents, partnersToPay: Object.keys(toPayByBrand).length, partnersMissingBilling },
    todo: { noticesToSend, contentToDelete },
    partners,
    events,
  });
}
