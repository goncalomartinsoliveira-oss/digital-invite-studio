import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Busca (do servidor, por causa de CORS) a miniatura og:image de um link
// colado no Moodboard. Só aceita pedidos com sessão válida — isto evita que
// a rota vire um proxy de busca de URLs aberto a qualquer pessoa na
// internet; o público desta funcionalidade é só contas pagas autenticadas,
// não visitantes anónimos. O bloqueio de endereços de rede interna abaixo
// cobre os casos óbvios (localhost, IPs privados literais), não é uma defesa
// completa contra SSRF via DNS rebinding — aceitável para este risco.

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname.toLowerCase())) return true;
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipMatch) return false;
  const a = Number(ipMatch[1]);
  const b = Number(ipMatch[2]);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 169;
}

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
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Link inválido." }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: "Link inválido." }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DigitalInviteStudioBot/1.0; +https://digitalinvitestudio.com)" },
    });
    clearTimeout(timeout);
    if (!res.ok || !res.body) return NextResponse.json({ imageUrl: null, title: null });

    // Só interessam as tags og: do <head> — parar de ler assim que ele
    // fechar, ou aos ~300KB, para nunca carregar a página toda para memória.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    while (html.length < 300_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
    reader.cancel().catch(() => {});

    const imageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);

    return NextResponse.json({
      imageUrl: imageMatch ? imageMatch[1] : null,
      title: titleMatch ? titleMatch[1] : null,
    });
  } catch (err) {
    console.error("[moodboard/unfurl]", err);
    return NextResponse.json({ imageUrl: null, title: null });
  }
}
