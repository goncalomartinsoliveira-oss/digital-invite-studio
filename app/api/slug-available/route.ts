import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// "Este link já existe?" ao criar um evento (dashboard/new-invite). Desde a
// migração 0020 cada pessoa só lê os seus eventos, por isso a verificação
// tem de ser feita no servidor. Só responde sim/não.

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return NextResponse.json({ available: false });
  const { data } = await supabaseAdmin.from("invitations").select("id").eq("slug", slug).maybeSingle();
  return NextResponse.json({ available: !data }, { headers: { "cache-control": "no-store" } });
}
