// Extração de miniatura (og:image/og:title) de um link colado no Moodboard.
// Partilhado por duas rotas: a autenticada (app/api/moodboard/unfurl, usada
// pelo painel) e a pública por token (app/api/moodboard/public/[token]),
// para não duplicar a mesma lógica de scraping/validação nas duas.

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname.toLowerCase())) return true;
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipMatch) return false;
  const a = Number(ipMatch[1]);
  const b = Number(ipMatch[2]);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 169;
}

/** Valida protocolo http(s) e bloqueia endereços óbvios de rede interna. Não é uma defesa completa contra SSRF via DNS rebinding. */
export function isFetchableUrl(url: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHost(parsed.hostname)) return null;
  return parsed;
}

export async function fetchOgImage(url: string): Promise<{ imageUrl: string | null; title: string | null }> {
  const parsed = isFetchableUrl(url);
  if (!parsed) return { imageUrl: null, title: null };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DigitalInviteStudioBot/1.0; +https://digitalinvitestudio.com)" },
    });
    clearTimeout(timeout);
    if (!res.ok || !res.body) return { imageUrl: null, title: null };

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

    return {
      imageUrl: imageMatch ? imageMatch[1] : null,
      title: titleMatch ? titleMatch[1] : null,
    };
  } catch (err) {
    console.error("[unfurl]", err);
    return { imageUrl: null, title: null };
  }
}
