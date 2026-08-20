import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveMoodboardShareLink } from "@/lib/moodboardShare";
import { MOODBOARD_PUBLIC_ITEM_LIMIT } from "@/lib/moodboard";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

// Upload de imagem a partir do link público de partilha do Moodboard — rota
// própria por ser multipart (a de ./[token]/route.ts trata só de JSON).
// Validado o mesmo token; nenhuma sessão envolvida.

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await resolveMoodboardShareLink(token);
  if (!link) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  const sectionId = formData.get("sectionId");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 });

  const [{ count }, { data: validSection }] = await Promise.all([
    supabaseAdmin.from("event_moodboard_items").select("id", { count: "exact", head: true }).eq("invitation_id", link.invitationId),
    typeof sectionId === "string" && sectionId
      ? supabaseAdmin.from("event_moodboard_sections").select("id").eq("id", sectionId).eq("invitation_id", link.invitationId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if ((count || 0) >= MOODBOARD_PUBLIC_ITEM_LIMIT) return NextResponse.json({ error: "limit_reached" }, { status: 429 });

  const ext = file.name.split(".").pop() || "jpg";
  const path = `moodboard/${link.invitationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage.from("invites").upload(path, file);
  if (uploadError) return NextResponse.json({ error: "upload_failed" }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage.from("invites").getPublicUrl(path);
  const { data: item, error } = await supabaseAdmin
    .from("event_moodboard_items")
    .insert([{
      invitation_id: link.invitationId,
      section_id: typeof sectionId === "string" && validSection ? sectionId : null,
      kind: "image",
      image_url: publicUrl,
    }])
    .select("*")
    .single();
  if (error || !item) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  return NextResponse.json({ item });
}
