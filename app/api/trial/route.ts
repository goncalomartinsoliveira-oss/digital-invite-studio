import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UUID_RE } from "@/lib/inviteAccess";
import { TRIAL_LIMIT } from "@/lib/trial";

// Modo de experiência (lib/trial.ts): quantas fotos e mensagens já tem um
// evento, e se as fotos / o livro de visitas já estão pagos. As páginas
// públicas consultam isto antes de cada envio. Precisa da service_role porque
// os convidados não podem ler as mensagens do livro de visitas (são privadas).
export async function GET(req: NextRequest) {
  const inv = req.nextUrl.searchParams.get("inv") || "";
  if (!UUID_RE.test(inv)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data: invite } = await supabaseAdmin.from("invitations").select("id, unlocked_modules").eq("id", inv).maybeSingle();
  if (!invite) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const unlocked: string[] = invite.unlocked_modules || [];

  const [{ data: files }, { count: messages }] = await Promise.all([
    supabaseAdmin.storage.from("fotos_evento").list(inv, { limit: 1000 }),
    supabaseAdmin.from("guestbook").select("id", { count: "exact", head: true }).eq("invitation_id", inv),
  ]);
  const photos = (files || []).filter(f => f.name !== ".emptyFolderPlaceholder" && !f.name.startsWith("private_")).length;

  return NextResponse.json({
    photos,
    messages: messages || 0,
    limit: TRIAL_LIMIT,
    unlocked: { photo_sharing: unlocked.includes("photo_sharing"), guestbook: unlocked.includes("guestbook") },
  });
}
