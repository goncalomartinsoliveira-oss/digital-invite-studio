import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UUID_RE } from "@/lib/inviteAccess";
import { loadPublicInvite, normalizeName, clean, RSVP_STATUS, fetchAdminGuests } from "@/lib/publicGuests";

// RSVP do link geral do convite (SmartRsvp), sem sessão. Antes, o browser lia
// e alterava a tabela guests diretamente, o que deixava qualquer pessoa ler os
// convidados de todos os eventos. Agora passa tudo por aqui (migração 0018):
//   GET  ?inv=&q=      → até 5 nomes parecidos (id e nome, nada mais)
//   GET  ?inv=&guest=  → o grupo desse convidado (para o formulário)
//   POST {inv, answers} → grava as respostas de UM grupo
//   POST {inv, request} → pedido de quem não está na lista (status "requested")
// Só com o convite publicado, dentro do prazo e, se houver código de acesso,
// depois de o convidado o ter introduzido.

const NO_STORE = { "cache-control": "no-store" };
const MEMBER_FIELDS = "id, name, category, status, dietary_notes, notes, group_id";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const invite = await loadPublicInvite(req, sp.get("inv"), "invite", { requireAccessCode: true });
  if (!invite) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });

  if (sp.get("tags")) {
    const { data } = await supabaseAdmin.from("invitations").select("dietary_tags").eq("id", invite.id).maybeSingle();
    return NextResponse.json({ dietary_tags: data?.dietary_tags || "" }, { headers: NO_STORE });
  }

  const guestId = sp.get("guest");
  if (guestId) {
    if (!UUID_RE.test(guestId)) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
    const { data: g } = await supabaseAdmin.from("guests").select("group_id, status").eq("id", guestId).eq("invitation_id", invite.id).maybeSingle();
    if (!g || g.status === "requested") return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
    const { data: members } = await supabaseAdmin
      .from("guests").select(MEMBER_FIELDS)
      .eq("invitation_id", invite.id).eq("group_id", g.group_id).neq("status", "requested");
    const list = ((members as any[]) || []).map(m => ({ id: m.id, name: m.name, category: m.category, status: m.status, dietary_notes: m.dietary_notes, notes: m.notes }));
    return NextResponse.json({ members: list }, { headers: NO_STORE });
  }

  const q = normalizeName(sp.get("q") || "");
  if (q.length < 3 || q.length > 60) return NextResponse.json({ matches: [] }, { headers: NO_STORE });
  const all = await fetchAdminGuests(invite.id, "id, name, status");
  const matches = all
    .filter(g => g.status !== "requested" && normalizeName(g.name).includes(q))
    .slice(0, 5)
    .map(g => ({ id: g.id, name: g.name }));
  return NextResponse.json({ matches }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_body" }, { status: 400 }); }
  const invite = await loadPublicInvite(req, typeof body?.inv === "string" ? body.inv : null, "invite", { requireAccessCode: true });
  if (!invite) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Pedido de quem não está na lista.
  if (body?.request) {
    const name = clean(body.request.name, 120);
    if (!name) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    const { error } = await supabaseAdmin.from("guests").insert([{
      invitation_id: invite.id,
      name,
      category: "adult",
      gender: "masculino",
      side: "comum",
      status: "requested",
      dietary_notes: null,
      notes: clean(body.request.notes, 1000),
      group_id: `REQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    }]);
    if (error) return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Respostas de um grupo.
  const answers = Array.isArray(body?.answers) ? body.answers : null;
  if (!answers || answers.length === 0 || answers.length > 50) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  for (const a of answers) {
    if (!a || typeof a.id !== "string" || !UUID_RE.test(a.id) || !RSVP_STATUS.has(a.status)) {
      return NextResponse.json({ error: "invalid_answer" }, { status: 400 });
    }
  }
  const { data: first } = await supabaseAdmin.from("guests").select("group_id, status").eq("id", answers[0].id).eq("invitation_id", invite.id).maybeSingle();
  if (!first || first.status === "requested") return NextResponse.json({ error: "invalid_answer" }, { status: 400 });
  const { data: members } = await supabaseAdmin
    .from("guests").select("id")
    .eq("invitation_id", invite.id).eq("group_id", first.group_id).neq("status", "requested");
  const allowed = new Set(((members as any[]) || []).map(m => m.id));
  if (answers.some((a: any) => !allowed.has(a.id))) return NextResponse.json({ error: "invalid_answer" }, { status: 400 });

  const results = await Promise.all(answers.map((a: any) =>
    supabaseAdmin.from("guests").update({
      status: a.status,
      dietary_notes: a.status === "confirmed" ? clean(a.dietary_notes) : null,
      notes: a.status === "confirmed" ? clean(a.notes) : null,
    }).eq("id", a.id).eq("invitation_id", invite.id)
  ));
  if (results.some(r => r.error)) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
