import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UUID_RE } from "@/lib/inviteAccess";
import { REF_COOKIE, attachReferral } from "@/lib/referrals";

// Liga a recomendação (cookie do link /r/CODIGO) ao evento dos noivos. Chamado
// ao criar o evento e ao abrir o painel; só o dono do evento, e só se o evento
// ainda não tiver recomendação. Sem cookie, não faz nada.
export async function POST(req: NextRequest) {
  const code = req.cookies.get(REF_COOKIE)?.value;
  if (!code) return NextResponse.json({ ok: true, attached: null });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: u } = await supabaseAdmin.auth.getUser(token);
  const email = u?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body?.invitationId || "");
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data: invite } = await supabaseAdmin.from("invitations").select("*").eq("id", id).maybeSingle();
  if (!invite) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if ((invite.user_email || "").trim().toLowerCase() !== email) return NextResponse.json({ ok: true, attached: null });

  const attached = await attachReferral(supabaseAdmin, invite, code);
  return NextResponse.json({ ok: true, attached });
}
