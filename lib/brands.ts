// ── Registry de marcas (white-label) ──────────────────────────────────
// Fonte de verdade das marcas por agora. No futuro pode ser substituído
// por uma tabela `brands` no Supabase — a forma (Brand) mantém-se igual.

export type Brand = {
  id: string;              // usado no atributo data-brand e nos overrides CSS
  name: string;            // nome apresentável da marca
  logo: string;            // logótipo para a web (pode ser .svg)
  logoRaster: string;      // logótipo .png (para canvas/PDF, que não lê .svg)
  logoAlt: string;
  tagline: string;
  domains: string[];       // hostnames que mapeiam para esta marca
  poweredBy: boolean;      // mostrar "powered by Digital Invite Studio" (co-brand)
  contactUrl?: string;     // contacto externo do parceiro; se ausente, usa /contact interno
  websiteUrl?: string;     // site principal do parceiro
  favicon?: string;        // ícone do separador do browser; se ausente, usa o do DIS
};

export const BRANDS: Record<string, Brand> = {
  dis: {
    id: "dis",
    name: "Digital Invite Studio",
    logo: "/logo-dis.svg",
    logoRaster: "/logo-dis.png",
    logoAlt: "Digital Invite Studio",
    tagline: "Convites digitais sofisticados para momentos inesquecíveis.",
    domains: ["digitalinvitestudio.com", "www.digitalinvitestudio.com"],
    poweredBy: false,
  },
  amazingmoon: {
    id: "amazingmoon",
    name: "Amazing Moon",
    logo: "/brands/amazingmoon/logo.png",
    logoRaster: "/brands/amazingmoon/logo.png",
    logoAlt: "Amazing Moon",
    tagline: "Design que transforma momentos em memórias eternas.",
    domains: ["digital.amazingmoon.pt"],
    poweredBy: true,
    contactUrl: "https://amazingmoon.pt/contacto",
    websiteUrl: "https://amazingmoon.pt",
    favicon: "/brands/amazingmoon/favicon.png",
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
