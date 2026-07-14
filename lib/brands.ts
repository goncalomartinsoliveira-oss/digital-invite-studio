// ── Registry de marcas (white-label) ──────────────────────────────────
// Fonte de verdade das marcas por agora. No futuro pode ser substituído
// por uma tabela `brands` no Supabase — a forma (Brand) mantém-se igual.

export type Brand = {
  id: string;          // usado no atributo data-brand e nos overrides CSS
  name: string;        // nome apresentável da marca
  logo: string;        // caminho do logótipo em /public
  logoAlt: string;
  tagline: string;
  domains: string[];   // hostnames que mapeiam para esta marca
};

export const BRANDS: Record<string, Brand> = {
  dis: {
    id: "dis",
    name: "Digital Invite Studio",
    logo: "/logo-dis.svg",
    logoAlt: "Digital Invite Studio",
    tagline: "Convites digitais sofisticados para momentos inesquecíveis.",
    domains: ["digitalinvitestudio.com", "www.digitalinvitestudio.com"],
  },
  amazingmoon: {
    id: "amazingmoon",
    name: "Amazing Moon",
    logo: "/brands/amazingmoon/logo.png",
    logoAlt: "Amazing Moon",
    tagline: "Design que transforma momentos em memórias eternas.",
    domains: ["digital.amazingmoon.pt"],
  },
};

export const DEFAULT_BRAND = BRANDS.dis;

// Resolve a marca ativa a partir do hostname (com override opcional por cookie,
// útil para testar antes de o subdomínio estar configurado).
export function resolveBrand(host?: string, cookieBrand?: string): Brand {
  if (cookieBrand && BRANDS[cookieBrand]) return BRANDS[cookieBrand];

  const h = (host || "").toLowerCase().split(":")[0];
  for (const b of Object.values(BRANDS)) {
    if (b.domains.some((d) => h === d || h.endsWith("." + d))) return b;
  }
  // Heurística: qualquer host que contenha "amazingmoon"
  if (h.includes("amazingmoon")) return BRANDS.amazingmoon;

  return DEFAULT_BRAND;
}
