import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UUID_RE, accessCookieName, accessCookieOptions, signAccessCookie } from "@/lib/inviteAccess";

// Para quem gere o evento: a pré-visualização do painel e o botão "Abrir
// convite" não devem pedir o código ao próprio administrador. O painel envia
// a sessão (Bearer); se essa pessoa tem acesso ao evento — dono, colaborador,
// staff da agência ou super-admin, as mesmas regras do painel — recebe o
// cookie de acesso, sem código.

export async function POST(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  const rawEmail = userData?.user?.email;
  if (authErr || !rawEmail) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const email = rawEmail.trim().toLowerCase();

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_body" }, { status: 400 }); }
  const invitationId = String(body?.invitationId ?? "");
  if (!UUID_RE.test(invitationId)) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { data: inv } = await supabaseAdmin
    .from("invitations").select("id, user_email, brand_id, access_code_enabled, access_code_version").eq("id", invitationId).maybeSingle();
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isOwner = (inv.user_email || "").trim().toLowerCase() === email;
  let allowed = isOwner;
  if (!allowed) {
    const [{ data: collab }, { data: sa }, member] = await Promise.all([
      supabaseAdmin.from("invitation_collaborators").select("id").eq("invitation_id", invitationId).eq("user_email", email).maybeSingle(),
      supabaseAdmin.from("super_admins").select("user_email").eq("user_email", email).maybeSingle(),
      inv.brand_id
        ? supabaseAdmin.from("brand_members").select("role").eq("brand_id", inv.brand_id).eq("user_email", email).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    allowed = !!collab || !!sa || !!member.data;
  }
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (!inv.access_code_enabled) return NextResponse.json({ ok: true, gated: false });
  const cookie = signAccessCookie(invitationId, inv.access_code_version ?? 1);
  if (!cookie) return NextResponse.json({ error: "not_configured" }, { status: 500 });
  const res = NextResponse.json({ ok: true, gated: true });
  res.cookies.set(accessCookieName(invitationId), cookie, accessCookieOptions());
  return res;
}
