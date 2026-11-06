import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { planEventCleanup, runEventCleanup } from "@/lib/eventCleanup";

// Apaga o conteúdo de eventos expirados (só super admin; ver lib/eventCleanup.ts).
// Corpo: { invitationIds: string[], dryRun?: boolean }
//   dryRun → devolve o que seria apagado (contagens), sem apagar nada.
// Só atua em eventos com expires_at no passado e ainda não limpos; os outros
// são devolvidos como "skipped", com o motivo.
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.invitationIds) ? body.invitationIds.filter((x: unknown) => typeof x === "string") : [];
  const dryRun = body?.dryRun === true;
  if (ids.length === 0) return NextResponse.json({ error: "Nenhum evento indicado." }, { status: 400 });
  if (ids.length > 200) return NextResponse.json({ error: "No máximo 200 eventos de cada vez." }, { status: 400 });

  const { data: invites, error } = await supabaseAdmin.from("invitations").select("*").in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sem a migração 0014 não há onde registar a limpeza: recusar antes de apagar.
  if ((invites || []).length && !("content_purged_at" in invites![0])) {
    return NextResponse.json({ error: "Falta correr a migração 0014_event_cleanup.sql no Supabase." }, { status: 409 });
  }

  const now = Date.now();
  const results: any[] = [];
  for (const inv of invites || []) {
    const name = inv.groom_name && inv.bride_name ? `${inv.groom_name} & ${inv.bride_name}` : inv.slug;
    if (!inv.expires_at || new Date(inv.expires_at).getTime() > now) { results.push({ id: inv.id, name, skipped: "not_expired" }); continue; }
    if (inv.content_purged_at) { results.push({ id: inv.id, name, skipped: "already_purged" }); continue; }
    try {
      const plan = await planEventCleanup(supabaseAdmin, inv);
      const counts = { files: plan.eventPhotos.length + plan.inviteFiles.length, guests: plan.guests, messages: plan.messages };
      if (!dryRun) await runEventCleanup(supabaseAdmin, inv, plan);
      results.push({ id: inv.id, name, ok: true, ...counts });
    } catch (e: any) {
      console.error("[event-cleanup]", inv.id, e?.message);
      results.push({ id: inv.id, name, error: e?.message || "Erro" });
    }
  }
  return NextResponse.json({ dryRun, results });
}
