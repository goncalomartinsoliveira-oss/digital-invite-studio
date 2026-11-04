import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GUEST_TOKEN_RE, resolveGuestLink } from "@/lib/guestLinks";

// Rota pública (sem sessão) do link personalizado de um grupo de convidados —
// o token é o controlo de acesso, validado no servidor com a service_role key.
// Devolve SÓ os membros do grupo desse token, nunca a lista de convidados
// toda (ao contrário da pesquisa por nome do link geral).
//   GET  → nome, lugares e membros do grupo (para a saudação e o RSVP)
//   POST → grava as respostas do RSVP dos membros desse grupo

const MEMBER_FIELDS = "id, name, category, status, dietary_notes, notes";
const VALID_STATUS = new Set(["pending", "confirmed", "declined"]);
const MAX_TEXT = 500;

async function loadLink(token: string, invitationId?: string | null) {
  if (!GUEST_TOKEN_RE.test(token)) return null;
  const { data: link } = await supabaseAdmin
    .from("guest_links")
    // "*" de propósito: funciona antes e depois da migração 0011 (colunas de aberturas).
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!link) return null;
  // O link tem de pertencer ao convite onde está a ser usado.
  if (invitationId && link.invitation_id !== invitationId) return null;

  // Convite expirado → o link deixa de funcionar (tal como o convite).
  const { data: inv } = await supabaseAdmin
    .from("invitations")
    .select("expires_at")
    .eq("id", link.invitation_id)
    .maybeSingle();
  if (!inv || (inv.expires_at && new Date(inv.expires_at) < new Date())) return null;
  return link;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await loadLink(token, req.nextUrl.searchParams.get("inv"));
  if (!link) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "no-store" } });

  const { data: members } = await supabaseAdmin
    .from("guests")
    .select(MEMBER_FIELDS)
    .eq("invitation_id", link.invitation_id)
    .eq("group_id", link.group_id)
    .neq("status", "requested");

  // Projeção explícita: só o que o formulário precisa, nunca o resto da linha.
  const list = (members || []).map(m => ({
    id: m.id, name: m.name, category: m.category, status: m.status, dietary_notes: m.dietary_notes, notes: m.notes,
  }));
  if (list.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "no-store" } });

  // "Quem já abriu": só datas e contagem, sem IP nem dados do aparelho. Cada
  // abertura do convite (já depois do código de acesso, se houver) faz um
  // pedido aqui. Falhas não afetam o convidado (ex.: migração por correr).
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("guest_links")
    .update({ first_opened_at: link.first_opened_at ?? now, last_opened_at: now, open_count: (link.open_count ?? 0) + 1 })
    .eq("token", token)
    .then(() => {}, () => {});

  return NextResponse.json(
    { invitationId: link.invitation_id, ...resolveGuestLink(list, link), members: list },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await loadLink(token, req.nextUrl.searchParams.get("inv"));
  if (!link) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_body" }, { status: 400 }); }
  const answers = Array.isArray(body?.answers) ? body.answers : null;
  if (!answers || answers.length === 0 || answers.length > 50) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  // Só pode alterar membros deste grupo.
  const { data: members } = await supabaseAdmin
    .from("guests")
    .select("id")
    .eq("invitation_id", link.invitation_id)
    .eq("group_id", link.group_id)
    .neq("status", "requested");
  const allowed = new Set((members || []).map(m => m.id));

  const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, MAX_TEXT) : null);
  for (const a of answers) {
    if (!a || !allowed.has(a.id) || !VALID_STATUS.has(a.status)) return NextResponse.json({ error: "invalid_answer" }, { status: 400 });
  }

  const results = await Promise.all(
    answers.map((a: any) =>
      supabaseAdmin
        .from("guests")
        .update({
          status: a.status,
          dietary_notes: a.status === "confirmed" ? clean(a.dietary_notes) : null,
          notes: a.status === "confirmed" ? clean(a.notes) : null,
        })
        .eq("id", a.id)
        .eq("invitation_id", link.invitation_id)
    )
  );
  if (results.some(r => r.error)) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
