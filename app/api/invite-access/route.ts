import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ACCESS_CODE_RE, UUID_RE, MAX_FAILS_PER_IP, WINDOW_PER_IP_MIN, MAX_FAILS_PER_INVITE, WINDOW_PER_INVITE_MIN,
  accessCookieName, accessCookieOptions, hashIp, safeEqualCode, signAccessCookie,
} from "@/lib/inviteAccess";

// Rota pública: o visitante envia o código de 4 dígitos do convite.
// Certo → cookie assinado (httpOnly) e o convite abre. Errado → pausa e
// registo da tentativa; passado o limite, 429. O código nunca sai do servidor.

const sinceMinutes = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_body" }, { status: 400 }); }
  const invitationId = String(body?.invitationId ?? "");
  const code = String(body?.code ?? "").trim();
  if (!UUID_RE.test(invitationId) || !ACCESS_CODE_RE.test(code)) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const ipHash = hashIp(ip, invitationId);

  const [{ count: ipFails }, { count: inviteFails }] = await Promise.all([
    supabaseAdmin.from("invite_access_attempts").select("id", { count: "exact", head: true })
      .eq("invitation_id", invitationId).eq("ip_hash", ipHash).gte("created_at", sinceMinutes(WINDOW_PER_IP_MIN)),
    supabaseAdmin.from("invite_access_attempts").select("id", { count: "exact", head: true })
      .eq("invitation_id", invitationId).gte("created_at", sinceMinutes(WINDOW_PER_INVITE_MIN)),
  ]);
  if ((ipFails || 0) >= MAX_FAILS_PER_IP || (inviteFails || 0) >= MAX_FAILS_PER_INVITE) {
    return NextResponse.json({ error: "too_many_attempts", retryAfterMinutes: WINDOW_PER_IP_MIN }, { status: 429 });
  }

  const { data: inv } = await supabaseAdmin
    .from("invitations").select("id, access_code_enabled, access_code_version").eq("id", invitationId).maybeSingle();
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!inv.access_code_enabled) return NextResponse.json({ ok: true });

  const { data: row } = await supabaseAdmin.from("invite_access").select("code").eq("invitation_id", invitationId).maybeSingle();
  if (!row) return NextResponse.json({ error: "not_configured" }, { status: 500 });

  if (!safeEqualCode(code, row.code)) {
    await supabaseAdmin.from("invite_access_attempts").insert([{ invitation_id: invitationId, ip_hash: ipHash }]);
    // Limpeza oportunista: tentativas com mais de um dia já não contam para nada.
    if (Math.random() < 0.05) {
      await supabaseAdmin.from("invite_access_attempts").delete().lt("created_at", sinceMinutes(24 * 60));
    }
    await sleep(400);
    return NextResponse.json({ error: "invalid_code", remaining: Math.max(0, MAX_FAILS_PER_IP - ((ipFails || 0) + 1)) }, { status: 401 });
  }

  const cookie = signAccessCookie(invitationId, inv.access_code_version ?? 1);
  if (!cookie) return NextResponse.json({ error: "not_configured" }, { status: 500 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(accessCookieName(invitationId), cookie, accessCookieOptions());
  return res;
}
