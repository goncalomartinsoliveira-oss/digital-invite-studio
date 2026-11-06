import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UUID_RE } from "@/lib/inviteAccess";
import { quoteFullPlan } from "@/lib/partnerPricing";

// Preço do Plano Completo para um evento, tal como o checkout o cobraria
// (lib/partnerPricing.ts). O painel mostra este valor em vez de o calcular no
// browser. Sessão no Authorization (Bearer) para saber se é staff do parceiro.
// Quem não pode pagar não recebe valores — o preço de parceiro nunca chega aos noivos.
export async function GET(req: NextRequest) {
  const inv = req.nextUrl.searchParams.get("inv") || "";
  if (!UUID_RE.test(inv)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data: invite } = await supabaseAdmin.from("invitations").select("*").eq("id", inv).maybeSingle();
  if (!invite) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const email = token ? (await supabaseAdmin.auth.getUser(token)).data?.user?.email ?? null : null;
  const quote = await quoteFullPlan(supabaseAdmin, invite, email);
  if (!quote.canBuy) return NextResponse.json({ payer: quote.payer, canBuy: false });
  return NextResponse.json(quote);
}
