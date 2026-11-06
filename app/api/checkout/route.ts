import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ALL_MODULE_IDS, type ModuleId } from "@/lib/modules";
import { FULL_PLAN } from "@/lib/pricing";
import { quoteFullPlan } from "@/lib/partnerPricing";
import { REF_COOKIE, attachReferral, findPartnerByCode } from "@/lib/referrals";
import { isCouponValid, couponAppliesToOrder, applyCouponDiscount, MIN_CHECKOUT_TOTAL_CENTS, type Coupon } from "@/lib/coupons";

// Cria uma sessão de checkout do Stripe para o Plano Completo de um evento
// (desbloqueia todos os módulos). Desde nov. 2026 é o único produto: um pedido
// com moduleIds ou outro bundleId (ecrãs antigos em cache) compra também o
// plano. Quem já tinha módulos paga só a diferença (fullPlanPriceFor). Os
// preços vêm sempre de lib/pricing.ts, nunca do que o cliente enviar.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invitationId, slug, locale, moduleIds, bundleId, couponCode } = body as {
      invitationId: string;
      slug: string;
      locale: string;
      moduleIds?: string[];
      bundleId?: string;
      couponCode?: string;
    };

    if (!invitationId || !slug || !locale) {
      return NextResponse.json({ error: "Dados em falta." }, { status: 400 });
    }

    const { data: invite, error } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    }

    // Quem está a pagar (sessão opcional): nos eventos de parceiros com
    // "pago eu", só a equipa do parceiro paga, ao preço de parceiro
    // (lib/partnerPricing.ts). Os noivos desses eventos não podem pagar.
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const buyerEmail = token ? (await supabaseAdmin.auth.getUser(token)).data?.user?.email ?? null : null;
    const quote = await quoteFullPlan(supabaseAdmin, invite, buyerEmail);
    if (!quote.canBuy) {
      return NextResponse.json({ error: "A publicação deste convite é feita pelo vosso parceiro." }, { status: 403 });
    }

    const alreadyUnlocked: string[] = invite.unlocked_modules || [];
    const toUnlock: ModuleId[] = ALL_MODULE_IDS.filter(m => !alreadyUnlocked.includes(m));
    if (toUnlock.length === 0) {
      return NextResponse.json({ error: "Nada por comprar — o evento já tem tudo desbloqueado." }, { status: 400 });
    }
    void moduleIds; void bundleId; // pedidos antigos: compram sempre o plano
    const bundleUsed = FULL_PLAN.id;
    const { cents: planCents, isUpgrade } = quote;

    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
    const successUrl = `${origin}/${locale}/dashboard/${slug}?checkout=success`;

    // Já pagou à peça tanto ou mais do que o plano custa: desbloqueia o que
    // falta sem pagamento (o Stripe nem aceita valores abaixo do mínimo).
    if (planCents < MIN_CHECKOUT_TOTAL_CENTS) {
      const { error: unlockError } = await supabaseAdmin
        .from("invitations")
        .update({ unlocked_modules: [...alreadyUnlocked, ...toUnlock] })
        .eq("id", invitationId);
      if (unlockError) return NextResponse.json({ error: "Erro ao desbloquear o plano." }, { status: 500 });
      return NextResponse.json({ url: successUrl });
    }

    let lineItems: { moduleId?: ModuleId; name: string; unitAmountCents: number }[] = [{
      name: isUpgrade ? "Digital Invite Studio — Plano Completo (diferença)" : "Digital Invite Studio — Plano Completo",
      unitAmountCents: planCents,
    }];

    // Recomendação de parceiro (lib/referrals.ts), só quando pagam os noivos:
    // um código de parceiro escrito no campo do código promocional atribui o
    // evento a esse parceiro (ganha ao link) e não dá desconto; sem código,
    // vale o cookie do link /r/CODIGO, se o evento ainda não tiver recomendação.
    let promoCode = couponCode;
    if (quote.payer === "couple") {
      const typed = couponCode?.trim();
      if (typed) {
        const { data: isCoupon } = await supabaseAdmin.from("coupons").select("id").eq("code", typed.toUpperCase()).maybeSingle();
        if (!isCoupon && (await findPartnerByCode(supabaseAdmin, typed))) {
          await attachReferral(supabaseAdmin, invite, typed, { override: true });
          promoCode = undefined;
        }
      }
      const cookieCode = req.cookies.get(REF_COOKIE)?.value;
      if (promoCode !== undefined || !typed) {
        if (cookieCode && !invite.referred_by_brand_id) await attachReferral(supabaseAdmin, invite, cookieCode);
      }
    }

    // Cupões vivem só na tabela `coupons` (leitura restrita a super-admin
    // via RLS), por isso a validação usa sempre o cliente service_role.
    // Os cupões são promoções para os noivos; não se somam ao preço de parceiro.
    if (promoCode && promoCode.trim() && quote.partnerPrice) {
      return NextResponse.json({ error: "Os códigos promocionais não se aplicam ao preço de parceiro." }, { status: 400 });
    }
    let appliedCoupon: Coupon | null = null;
    if (promoCode && promoCode.trim()) {
      const normalizedCode = promoCode.trim().toUpperCase();
      const { data: couponRow, error: couponError } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", normalizedCode)
        .maybeSingle();

      if (couponError) {
        return NextResponse.json({ error: "Erro ao validar o cupão." }, { status: 500 });
      }
      const coupon = couponRow as Coupon | null;
      if (!coupon || !isCouponValid(coupon) || !couponAppliesToOrder(coupon, { bundleId: bundleUsed, moduleIds: toUnlock })) {
        return NextResponse.json({ error: "Cupão inválido, expirado ou não aplicável a esta compra." }, { status: 400 });
      }
      appliedCoupon = coupon;

      const { amounts, totalCents } = applyCouponDiscount(
        lineItems.map(li => ({ moduleId: li.moduleId, unitAmountCents: li.unitAmountCents })),
        appliedCoupon
      );
      if (totalCents < MIN_CHECKOUT_TOTAL_CENTS) {
        return NextResponse.json({ error: "O desconto deixaria o valor abaixo do mínimo permitido." }, { status: 400 });
      }
      lineItems = lineItems.map((li, idx) => ({ ...li, unitAmountCents: amounts[idx] }));
    }

    const stripeLineItems = lineItems.map(li => ({
      price_data: {
        currency: "eur",
        product_data: { name: li.name },
        unit_amount: li.unitAmountCents,
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: stripeLineItems,
      success_url: successUrl,
      cancel_url: `${origin}/${locale}/dashboard/${slug}?checkout=cancelled`,
      metadata: {
        invitationId,
        moduleIds: toUnlock.join(","),
        bundleId: bundleUsed || "",
        couponCode: appliedCoupon?.code || "",
        couponId: appliedCoupon?.id || "",
        payer: quote.payer,
        locale,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Erro ao criar sessão de checkout:", err);
    return NextResponse.json({ error: "Erro ao iniciar o pagamento." }, { status: 500 });
  }
}
