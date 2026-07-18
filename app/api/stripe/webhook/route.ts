import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ModuleId } from "@/lib/modules";

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

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as any;
  const invitationId: string | undefined = session.metadata?.invitationId;
  const moduleIds: ModuleId[] = (session.metadata?.moduleIds || "")
    .split(",")
    .filter(Boolean) as ModuleId[];
  const bundleId: string | null = session.metadata?.bundleId || null;

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
      .select("unlocked_modules")
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
      paid_at: new Date().toISOString(),
    });

    if (insertError) throw new Error(`insert payments falhou: ${insertError.message}`);

    console.log(`[stripe-webhook] Sucesso: invitation ${invitationId} desbloqueou [${moduleIds.join(", ")}]`);
  } catch (err: any) {
    // Devolver 500 (em vez de engolir o erro) faz o Stripe repetir a entrega
    // mais tarde — melhor do que perder silenciosamente uma compra paga.
    console.error("[stripe-webhook] Erro a aplicar a compra:", err.message);
    return NextResponse.json({ error: "Erro ao processar o pagamento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
