import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ALL_MODULE_IDS, expandWithDependencies, type ModuleId } from "@/lib/modules";
import { getBundle, fetchPricingOverrides, effectiveModulePriceCents, effectiveBundlePriceCents } from "@/lib/pricing";
import { isCouponValid, couponAppliesToOrder, applyCouponDiscount, MIN_CHECKOUT_TOTAL_CENTS, type Coupon } from "@/lib/coupons";

const MODULE_NAMES: Record<ModuleId, string> = {
  save_the_date: "Save the Date",
  invite: "Convite de Casamento",
  guests_seating: "Convidados & Mesas",
  photo_sharing: "Photo Sharing & Live Wall",
  guestbook: "Guestbook",
};

// Cria uma sessão de checkout do Stripe para desbloquear módulos de um
// evento — à peça (moduleIds) ou como bundle (bundleId). Os preços vêm
// sempre de lib/pricing.ts, nunca do que o cliente enviar no pedido.
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

    const { data: invite, error } = await supabase
      .from("invitations")
      .select("id, unlocked_modules, brand_id")
      .eq("id", invitationId)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    }

    // Preços diferenciados por parceiro/marca (lib/pricing.ts) — sem
    // override para este brand_id, cai sempre no preço global.
    const pricingOverrides = await fetchPricingOverrides(supabaseAdmin, invite.brand_id);

    const alreadyUnlocked: string[] = invite.unlocked_modules || [];
    let toPurchase: ModuleId[];
    let bundleUsed: string | null = null;

    if (bundleId) {
      const bundle = getBundle(bundleId);
      if (!bundle) return NextResponse.json({ error: "Bundle inválida." }, { status: 400 });
      // O preço da bundle é fixo para o conjunto completo — se já tiver
      // algum dos módulos incluídos, comprá-la de novo cobrava a dobrar
      // por esse módulo. Nesse caso, sugerir compra à peça dos que faltam.
      const alreadyOwnsSome = bundle.moduleIds.some(m => alreadyUnlocked.includes(m));
      if (alreadyOwnsSome) {
        return NextResponse.json(
          { error: "Já tem alguns dos módulos deste pacote — compre os que faltam à peça." },
          { status: 400 }
        );
      }
      toPurchase = bundle.moduleIds;
      bundleUsed = bundle.id;
    } else {
      const requested = (moduleIds || []).filter((m): m is ModuleId => ALL_MODULE_IDS.includes(m as ModuleId));
      toPurchase = requested.filter(m => !alreadyUnlocked.includes(m));
    }

    if (toPurchase.length === 0) {
      return NextResponse.json({ error: "Nada por comprar — módulos já desbloqueados." }, { status: 400 });
    }

    // toPurchase é o que é cobrado (linhas do Stripe); toUnlock é o que
    // realmente fica desbloqueado — inclui dependências gratuitas (ex.:
    // comprar "invite" desbloqueia sempre "guests_seating" também, sem
    // custo extra, porque o RSVP não funciona sem lista de convidados).
    const toUnlock = expandWithDependencies(toPurchase).filter(m => !alreadyUnlocked.includes(m));

    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;

    let lineItems: { moduleId?: ModuleId; name: string; unitAmountCents: number }[];
    if (bundleUsed) {
      const bundle = getBundle(bundleUsed)!;
      lineItems = [{ name: `Digital Invite Studio — ${bundle.id}`, unitAmountCents: effectiveBundlePriceCents(bundle, pricingOverrides) }];
    } else {
      lineItems = toPurchase.map(moduleId => ({
        moduleId,
        name: `Digital Invite Studio — ${MODULE_NAMES[moduleId]}`,
        unitAmountCents: effectiveModulePriceCents(moduleId, pricingOverrides),
      }));
    }

    // Cupões vivem só na tabela `coupons` (leitura restrita a super-admin
    // via RLS), por isso a validação usa sempre o cliente service_role.
    let appliedCoupon: Coupon | null = null;
    if (couponCode && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const { data: couponRow, error: couponError } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", normalizedCode)
        .maybeSingle();

      if (couponError) {
        return NextResponse.json({ error: "Erro ao validar o cupão." }, { status: 500 });
      }
      const coupon = couponRow as Coupon | null;
      if (!coupon || !isCouponValid(coupon) || !couponAppliesToOrder(coupon, { bundleId: bundleUsed, moduleIds: toPurchase })) {
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
      success_url: `${origin}/${locale}/dashboard/${slug}?checkout=success`,
      cancel_url: `${origin}/${locale}/dashboard/${slug}?checkout=cancelled`,
      metadata: {
        invitationId,
        moduleIds: toUnlock.join(","),
        bundleId: bundleUsed || "",
        couponCode: appliedCoupon?.code || "",
        couponId: appliedCoupon?.id || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Erro ao criar sessão de checkout:", err);
    return NextResponse.json({ error: "Erro ao iniciar o pagamento." }, { status: 500 });
  }
}
