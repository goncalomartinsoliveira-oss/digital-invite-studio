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
    console.error("Assinatura do webhook inválida:", err.message);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const invitationId: string | undefined = session.metadata?.invitationId;
    const moduleIds: ModuleId[] = (session.metadata?.moduleIds || "")
      .split(",")
      .filter(Boolean) as ModuleId[];
    const bundleId: string | null = session.metadata?.bundleId || null;

    if (!invitationId || moduleIds.length === 0) {
      console.error("Webhook sem metadata suficiente para aplicar a compra.", session.id);
      return NextResponse.json({ received: true });
    }

    // Idempotência: se já processámos esta sessão (reentrega do Stripe), não repetir.
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true });
    }

    const { data: invite } = await supabaseAdmin
      .from("invitations")
      .select("unlocked_modules")
      .eq("id", invitationId)
      .single();

    const current: string[] = invite?.unlocked_modules || [];
    const updated = Array.from(new Set([...current, ...moduleIds]));

    await supabaseAdmin.from("invitations").update({ unlocked_modules: updated }).eq("id", invitationId);

    await supabaseAdmin.from("payments").insert({
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
  }

  return NextResponse.json({ received: true });
}
