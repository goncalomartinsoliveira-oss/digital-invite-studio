import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchOgImage, isFetchableUrl } from "@/lib/unfurl";

// Busca (do servidor, por causa de CORS) a miniatura og:image de um link
// colado no Moodboard, a partir do painel — só aceita pedidos com sessão
// válida. A rota equivalente para o link público de partilha
// (app/api/moodboard/public/[token]) reaproveita a mesma lógica de scraping
// em lib/unfurl.ts, mas o controlo de acesso aí é o token, não uma sessão.

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData?.user?.email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { url } = await req.json();
  if (!isFetchableUrl(url)) return NextResponse.json({ error: "Link inválido." }, { status: 400 });

  const result = await fetchOgImage(url);
  return NextResponse.json(result);
}
