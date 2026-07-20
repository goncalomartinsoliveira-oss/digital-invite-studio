import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend, CONTACT_FROM } from "@/lib/resend";
import type { ModuleId } from "@/lib/modules";

const MODULE_NAMES: Record<ModuleId, string> = {
  save_the_date: "Save the Date",
  invite: "Convite de Casamento",
  guests_seating: "Convidados & Mesas",
  photo_sharing: "Photo Sharing & Live Wall",
  guestbook: "Guestbook",
};

const BUNDLE_NAMES: Record<string, string> = {
  convite: "Pacote Convite",
  momentos: "Pacote Momentos",
  completo: "Pacote Completo",
};

// Ponto de confiança único: só aqui (código de servidor, com a service_role
// key) é que unlocked_modules é escrito a partir de um pagamento. O corpo
// tem de chegar em bruto (sem parsing) para a verificação de assinatura.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("[stripe-webhook] Assinatura inválida:", err.message);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  console.log(`[stripe-webhook] Evento recebido: ${event.type} (${event.id})`);

  if (event.type === "checkout.session.completed") {
    return handleCheckoutCompleted(event.data.object as any);
  }
  if (event.type === "charge.refunded") {
    return handleChargeRefunded(event.data.object as any);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: any) {
  const invitationId: string | undefined = session.metadata?.invitationId;
  const moduleIds: ModuleId[] = (session.metadata?.moduleIds || "")
    .split(",")
    .filter(Boolean) as ModuleId[];
  const bundleId: string | null = session.metadata?.bundleId || null;
  const couponCode: string | null = session.metadata?.couponCode || null;
  const couponId: string | null = session.metadata?.couponId || null;
  const locale: string = session.metadata?.locale === "en" ? "en" : "pt";

  console.log(`[stripe-webhook] session=${session.id} invitationId=${invitationId} moduleIds=${moduleIds.join(",")}`);

  if (!invitationId || moduleIds.length === 0) {
    console.error(`[stripe-webhook] Metadata em falta na sessão ${session.id} — nada a aplicar.`);
    return NextResponse.json({ received: true });
  }

  try {
    // Idempotência: se já processámos esta sessão (reentrega do Stripe), não repetir.
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existingError) throw new Error(`select payments falhou: ${existingError.message}`);
    if (existing) {
      console.log(`[stripe-webhook] Sessão ${session.id} já tinha sido processada, a ignorar.`);
      return NextResponse.json({ received: true });
    }

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invitations")
      .select("unlocked_modules, slug, groom_name, bride_name")
      .eq("id", invitationId)
      .single();

    if (inviteError) throw new Error(`select invitations falhou: ${inviteError.message}`);

    const current: string[] = invite?.unlocked_modules || [];
    const updated = Array.from(new Set([...current, ...moduleIds]));

    const { error: updateError } = await supabaseAdmin
      .from("invitations")
      .update({ unlocked_modules: updated })
      .eq("id", invitationId);

    if (updateError) throw new Error(`update invitations falhou: ${updateError.message}`);

    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      invitation_id: invitationId,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent || null,
      module_ids: moduleIds,
      bundle_id: bundleId,
      amount_cents: session.amount_total,
      currency: session.currency || "eur",
      status: "paid",
      customer_email: session.customer_details?.email || null,
      coupon_code: couponCode,
      paid_at: new Date().toISOString(),
    });

    if (insertError) throw new Error(`insert payments falhou: ${insertError.message}`);

    // Contagem de resgates do cupão — não crítico o suficiente para fazer
    // falhar o webhook (a compra já ficou registada) por isso só regista o
    // erro em log, não devolve 500.
    if (couponId) {
      const { data: couponRow, error: couponFetchError } = await supabaseAdmin
        .from("coupons")
        .select("times_redeemed")
        .eq("id", couponId)
        .maybeSingle();

      if (couponFetchError || !couponRow) {
        console.error(`[stripe-webhook] Não foi possível ler o cupão ${couponId} para incrementar resgates.`);
      } else {
        const { error: couponUpdateError } = await supabaseAdmin
          .from("coupons")
          .update({ times_redeemed: couponRow.times_redeemed + 1 })
          .eq("id", couponId);
        if (couponUpdateError) {
          console.error(`[stripe-webhook] Falha ao incrementar resgates do cupão ${couponId}: ${couponUpdateError.message}`);
        }
      }
    }

    // Email de confirmação de compra — como o resgate de cupão, não é
    // crítico o suficiente para fazer o webhook falhar (a compra e o
    // desbloqueio já ficaram feitos); só regista o erro em log.
    const customerEmail: string | undefined = session.customer_details?.email || undefined;
    if (customerEmail) {
      try {
        const itemLabel = bundleId
          ? (BUNDLE_NAMES[bundleId] || bundleId)
          : moduleIds.map(m => MODULE_NAMES[m] || m).join(", ");
        const coupleName = invite?.groom_name && invite?.bride_name
          ? `${invite.groom_name} & ${invite.bride_name}`
          : invite?.slug || "";
        const dashboardUrl = invite?.slug
          ? `https://www.digitalinvitestudio.com/${locale}/dashboard/${invite.slug}`
          : "https://www.digitalinvitestudio.com";
        const amountLabel = new Intl.NumberFormat(locale === "en" ? "en-IE" : "pt-PT", {
          style: "currency",
          currency: (session.currency || "eur").toUpperCase(),
        }).format((session.amount_total || 0) / 100);

        const subject = locale === "en" ? "Purchase confirmed — Digital Invite Studio" : "Compra confirmada — Digital Invite Studio";
        const html = locale === "en"
          ? `<p>Hi,</p><p>We've received your payment for <strong>${coupleName}</strong>. Here's your receipt:</p><ul><li><strong>Item:</strong> ${itemLabel}</li><li><strong>Amount:</strong> ${amountLabel}</li></ul><p><a href="${dashboardUrl}">Open your dashboard</a></p><p>Thank you!<br/>Digital Invite Studio</p>`
          : `<p>Olá,</p><p>Recebemos o seu pagamento para <strong>${coupleName}</strong>. Aqui fica o seu recibo:</p><ul><li><strong>Item:</strong> ${itemLabel}</li><li><strong>Valor:</strong> ${amountLabel}</li></ul><p><a href="${dashboardUrl}">Abrir o seu painel</a></p><p>Obrigado!<br/>Digital Invite Studio</p>`;

        const { error: emailError } = await resend.emails.send({
          from: CONTACT_FROM,
          to: customerEmail,
          subject,
          html,
        });
        if (emailError) {
          console.error(`[stripe-webhook] Falha ao enviar email de confirmação: ${emailError.message}`);
        }
      } catch (emailErr: any) {
        console.error("[stripe-webhook] Erro ao enviar email de confirmação:", emailErr.message);
      }
    }

    console.log(`[stripe-webhook] Sucesso: invitation ${invitationId} desbloqueou [${moduleIds.join(", ")}]`);
  } catch (err: any) {
    // Devolver 500 (em vez de engolir o erro) faz o Stripe repetir a entrega
    // mais tarde — melhor do que perder silenciosamente uma compra paga.
    console.error("[stripe-webhook] Erro a aplicar a compra:", err.message);
    return NextResponse.json({ error: "Erro ao processar o pagamento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Um reembolso no Stripe (total ou parcial) chega aqui como "charge.refunded".
// Só um reembolso TOTAL revoga módulos automaticamente — um parcial é
// ambíguo (não dá para saber qual módulo, de vários, está a ser devolvido),
// por isso fica só registado para o super-admin tratar à mão.
async function handleChargeRefunded(charge: any) {
  const paymentIntentId: string | undefined = charge.payment_intent || undefined;
  if (!paymentIntentId) {
    console.error(`[stripe-webhook] charge.refunded sem payment_intent (charge ${charge.id}) — nada a aplicar.`);
    return NextResponse.json({ received: true });
  }

  try {
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("stripe_payment_intent", paymentIntentId)
      .maybeSingle();

    if (paymentError) throw new Error(`select payments falhou: ${paymentError.message}`);
    if (!payment) {
      console.log(`[stripe-webhook] Reembolso ${charge.id} não corresponde a nenhum pagamento nosso (payment_intent ${paymentIntentId}) — ignorado.`);
      return NextResponse.json({ received: true });
    }
    if (payment.status === "refunded") {
      console.log(`[stripe-webhook] Pagamento ${payment.id} já estava marcado como reembolsado, a ignorar.`);
      return NextResponse.json({ received: true });
    }

    const isFullRefund = charge.amount_refunded >= charge.amount;
    const newStatus = isFullRefund ? "refunded" : "partially_refunded";

    const { error: statusUpdateError } = await supabaseAdmin
      .from("payments")
      .update({ status: newStatus, refunded_at: new Date().toISOString(), amount_refunded_cents: charge.amount_refunded })
      .eq("id", payment.id);
    if (statusUpdateError) throw new Error(`update payments falhou: ${statusUpdateError.message}`);

    if (!isFullRefund) {
      console.log(`[stripe-webhook] Reembolso parcial no pagamento ${payment.id} — módulos mantidos, requer revisão manual.`);
      return NextResponse.json({ received: true });
    }

    const refundedModuleIds: string[] = payment.module_ids || [];
    if (refundedModuleIds.length === 0) {
      return NextResponse.json({ received: true });
    }

    // Só revoga um módulo se nenhum OUTRO pagamento pago (não reembolsado)
    // da mesma invitation também o incluir — evita revogar um módulo que
    // continua legitimamente coberto por outra compra.
    const { data: otherPayments, error: otherError } = await supabaseAdmin
      .from("payments")
      .select("module_ids, status")
      .eq("invitation_id", payment.invitation_id)
      .neq("id", payment.id);
    if (otherError) throw new Error(`select payments (outros) falhou: ${otherError.message}`);

    const stillCovered = new Set<string>();
    (otherPayments || []).forEach((p: any) => {
      if (p.status === "paid") (p.module_ids || []).forEach((m: string) => stillCovered.add(m));
    });
    const toRevoke = refundedModuleIds.filter(m => !stillCovered.has(m));

    if (toRevoke.length > 0) {
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from("invitations")
        .select("unlocked_modules")
        .eq("id", payment.invitation_id)
        .single();
      if (inviteError) throw new Error(`select invitations falhou: ${inviteError.message}`);

      const current: string[] = invite?.unlocked_modules || [];
      const updated = current.filter(m => !toRevoke.includes(m));

      const { error: revokeError } = await supabaseAdmin
        .from("invitations")
        .update({ unlocked_modules: updated })
        .eq("id", payment.invitation_id);
      if (revokeError) throw new Error(`update invitations (revogar) falhou: ${revokeError.message}`);
    }

    console.log(`[stripe-webhook] Reembolso total no pagamento ${payment.id}: revogados [${toRevoke.join(", ")}]`);
  } catch (err: any) {
    console.error("[stripe-webhook] Erro a processar reembolso:", err.message);
    return NextResponse.json({ error: "Erro ao processar o reembolso." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
