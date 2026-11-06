import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { resend, CONTACT_FROM } from "@/lib/resend";

// E-mail aos noivos a avisar do fim do prazo (só super admin): o conteúdo fica
// disponível até expires_at (60 dias depois do casamento) e depois pode ser
// apagado. Corpo: { invitationIds: string[] }. Só envia a eventos que ainda
// não expiraram; grava expiry_notice_sent_at (migração 0014).

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.invitationIds) ? body.invitationIds.filter((x: unknown) => typeof x === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "Nenhum evento indicado." }, { status: 400 });
  if (ids.length > 100) return NextResponse.json({ error: "No máximo 100 eventos de cada vez." }, { status: 400 });

  const { data: invites, error } = await supabaseAdmin.from("invitations").select("*").in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sem a migração 0014 o envio não fica registado (e podia repetir-se): recusar.
  if ((invites || []).length && !("expiry_notice_sent_at" in invites![0])) {
    return NextResponse.json({ error: "Falta correr a migração 0014_event_cleanup.sql no Supabase." }, { status: 409 });
  }

  const now = Date.now();
  const results: any[] = [];
  for (const inv of invites || []) {
    const name = inv.groom_name && inv.bride_name ? `${inv.groom_name} & ${inv.bride_name}` : inv.slug;
    if (!inv.expires_at || new Date(inv.expires_at).getTime() <= now) { results.push({ id: inv.id, name, skipped: "expired" }); continue; }
    if (!inv.user_email) { results.push({ id: inv.id, name, skipped: "no_email" }); continue; }

    const until = new Date(inv.expires_at).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
    const dashboardUrl = `https://www.digitalinvitestudio.com/pt/dashboard/${encodeURIComponent(inv.slug)}`;
    const html =
      `<p>Olá,</p>` +
      `<p>Esperamos que o casamento <strong>${esc(name)}</strong> tenha sido inesquecível!</p>` +
      `<p>As fotos, os vídeos e as mensagens que os vossos convidados partilharam continuam disponíveis no vosso painel até <strong>${esc(until)}</strong>. ` +
      `Depois dessa data, o convite deixa de estar online e o conteúdo é apagado, incluindo a lista de convidados.</p>` +
      `<p>Para guardarem tudo, abram o painel e descarreguem:</p>` +
      `<ul><li>as fotos e os vídeos, em <strong>Photo Sharing &amp; Live Wall</strong>, no botão <strong>ZIP</strong>;</li>` +
      `<li>as mensagens, áudios e vídeos, em <strong>Guestbook</strong>, também em ZIP.</li></ul>` +
      `<p><a href="${dashboardUrl}">Abrir o vosso painel</a></p>` +
      `<p>Muitas felicidades!<br/>Digital Invite Studio</p>`;

    try {
      const { error: sendError } = await resend.emails.send({
        from: CONTACT_FROM,
        to: inv.user_email,
        subject: `O conteúdo do vosso casamento fica disponível até ${until}`,
        html,
      });
      if (sendError) throw new Error(sendError.message);
      const { error: upError } = await supabaseAdmin.from("invitations").update({ expiry_notice_sent_at: new Date().toISOString() }).eq("id", inv.id);
      results.push({ id: inv.id, name, ok: true, warning: upError ? `Enviado, mas não ficou registado: ${upError.message}` : undefined });
    } catch (e: any) {
      console.error("[expiry-notice]", inv.id, e?.message);
      results.push({ id: inv.id, name, error: e?.message || "Erro ao enviar" });
    }
  }
  return NextResponse.json({ results });
}
