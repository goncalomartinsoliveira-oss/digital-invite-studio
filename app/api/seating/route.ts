import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { loadPublicInvite, normalizeName, fetchAdminGuests } from "@/lib/publicGuests";

// "Encontre a sua mesa" (página pública /seating/[slug]), sem sessão. Antes, o
// browser descarregava a lista de convidados com mesa; agora pesquisa aqui
// (migração 0018) e só recebe os nomes que coincidem, com o nome da mesa.
//   GET ?inv=&q=  (pelo menos 2 letras) → até 10 { id, name, table }
// Só com o módulo Convidados & Mesas ativo e dentro do prazo.

const NO_STORE = { "cache-control": "no-store" };

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const invite = await loadPublicInvite(req, sp.get("inv"), "guests_seating");
  if (!invite) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });

  const q = normalizeName(sp.get("q") || "");
  if (q.length < 2 || q.length > 60) return NextResponse.json({ matches: [] }, { headers: NO_STORE });

  const guests = (await fetchAdminGuests(invite.id, "id, name, table_id"))
    .filter(g => g.table_id && normalizeName(g.name).includes(q))
    .slice(0, 10);
  if (guests.length === 0) return NextResponse.json({ matches: [] }, { headers: NO_STORE });

  const { data: tables } = await supabaseAdmin.from("event_tables").select("id, name").eq("invitation_id", invite.id);
  const names = new Map(((tables as any[]) || []).map(t => [t.id, t.name]));
  return NextResponse.json(
    { matches: guests.map(g => ({ id: g.id, name: g.name, table: names.get(g.table_id) ?? null })) },
    { headers: NO_STORE }
  );
}
