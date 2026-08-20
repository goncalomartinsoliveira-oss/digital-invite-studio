import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveMoodboardShareLink, loadMoodboardShareData } from "@/lib/moodboardShare";
import { fetchOgImage, isFetchableUrl } from "@/lib/unfurl";
import { MOODBOARD_PUBLIC_ITEM_LIMIT } from "@/lib/moodboard";

// Rota pública (sem sessão) do link de partilha do Moodboard — o token é o
// próprio controlo de acesso, validado do lado do servidor com a
// service_role key (nunca a anon key). GET devolve o estado atual; POST
// acrescenta um item do tipo "link" (colar um link do Pinterest/Instagram).
// Upload de imagem tem rota própria (./upload), por ser multipart.

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await resolveMoodboardShareLink(token);
  if (!link) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const data = await loadMoodboardShareData(link.invitationId);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await resolveMoodboardShareLink(token);
  if (!link) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { url, sectionId } = await req.json();
  if (!isFetchableUrl(url)) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const [{ count }, { data: validSection }] = await Promise.all([
    supabaseAdmin.from("event_moodboard_items").select("id", { count: "exact", head: true }).eq("invitation_id", link.invitationId),
    sectionId
      ? supabaseAdmin.from("event_moodboard_sections").select("id").eq("id", sectionId).eq("invitation_id", link.invitationId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if ((count || 0) >= MOODBOARD_PUBLIC_ITEM_LIMIT) return NextResponse.json({ error: "limit_reached" }, { status: 429 });

  const { data: item, error } = await supabaseAdmin
    .from("event_moodboard_items")
    .insert([{ invitation_id: link.invitationId, section_id: sectionId && validSection ? sectionId : null, kind: "link", source_url: url }])
    .select("*")
    .single();
  if (error || !item) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  const { imageUrl } = await fetchOgImage(url);
  if (imageUrl) {
    await supabaseAdmin.from("event_moodboard_items").update({ image_url: imageUrl }).eq("id", item.id);
    item.image_url = imageUrl;
  }

  return NextResponse.json({ item });
}
