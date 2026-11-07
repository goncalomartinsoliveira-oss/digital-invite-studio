import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PUBLIC_EVENT_FIELDS, pickFields } from "@/lib/publicEvent";

// Dados públicos de um evento, pelo slug (migração 0020). Usado pelas páginas
// /moments, /live-wall, /guestbook, /rsvp e /seating, que antes liam a tabela
// invitations diretamente. Só devolve nomes, imagem de perfil, marca, prazo e
// módulos ativos (para os ecrãs "expirado" / "indisponível") — nunca e-mails,
// orçamento, pagamentos ou o conteúdo do convite.

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") || "").trim();
  if (!slug || slug.length > 200) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data } = await supabaseAdmin
    .from("invitations")
    .select(PUBLIC_EVENT_FIELDS.join(", "))
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "no-store" } });
  return NextResponse.json(pickFields(data as any, PUBLIC_EVENT_FIELDS), { headers: { "cache-control": "no-store" } });
}
