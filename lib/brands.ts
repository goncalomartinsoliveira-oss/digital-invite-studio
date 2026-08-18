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

// ── Marca "de trabalho" (parceiros leves, sem domínio) ────────────────
// Resolve a info (nome + logo + contacto) de uma marca por id, do registry
// OU da BD. O contactUrl é o que diferencia um evento de parceiro de um
// evento direto da DIS nos ecrãs de compra (ver dashboard/[slug]).
export type WorkingBrand = { id: string; name: string; logo: string; logoRaster: string; contactUrl?: string };

export async function resolveBrandById(sb: any, id?: string): Promise<WorkingBrand | null> {
  if (!id || id === "dis") return null; // 'dis' é o default — sem override
  if (BRANDS[id]) {
    const b = BRANDS[id];
    return { id: b.id, name: b.name, logo: b.logo, logoRaster: b.logoRaster, contactUrl: b.contactUrl };
  }
  const { data } = await sb.from("brands").select("id, name, logo_url, contact_url").eq("id", id).maybeSingle();
  if (!data) return null;
  return { id: data.id, name: data.name, logo: data.logo_url || "/logo-dis.svg", logoRaster: data.logo_url || "/logo-dis.png", contactUrl: data.contact_url || undefined };
}

// A marca do parceiro a que o utilizador pertence (usada no domínio DIS para
// mostrar o logo do parceiro e etiquetar os eventos que ele cria).
export async function resolveWorkingBrand(sb: any, email: string, domainBrandId: string): Promise<WorkingBrand | null> {
  if (domainBrandId !== "dis" || !email) return null;
  // super_admins/brand_members guardam o email normalizado (trim+minúsculas,
  // ver MembersManagementView) — comparar aqui com o email em bruto da sessão
  // falha sempre que a capitalização não bater certo (ex.: login por Google
  // devolve maiúsculas onde o email foi escrito em minúsculas). Foi isto que
  // fez um evento criado por um wedding planner ficar preso à marca "dis" em
  // vez da marca do parceiro.
  const normEmail = email.trim().toLowerCase();
  // Super-admins são staff do master — não assumem a marca de um parceiro.
  const { data: sa } = await sb.from("super_admins").select("user_email").eq("user_email", normEmail).maybeSingle();
  if (sa) return null;
  const { data: mems } = await sb.from("brand_members").select("brand_id").eq("user_email", normEmail);
  const partnerId = ((mems as any[]) || []).map(m => m.brand_id).find((id: string) => id && id !== "dis");
  return resolveBrandById(sb, partnerId);
}

// Resolve a marca ativa a partir do hostname (com override opcional por cookie,
// útil para testar antes de o subdomínio estar configurado).
export function resolveBrand(host?: string, cookieBrand?: string): Brand {
  const h = (host || "").toLowerCase().split(":")[0];

  // 1. Domínio manda sempre (marcas reais têm domínio próprio).
  for (const b of Object.values(BRANDS)) {
    if (b.domains.some((d) => h === d || h.endsWith("." + d))) return b;
  }
  // Heurística: qualquer host que contenha "amazingmoon".
  if (h.includes("amazingmoon")) return BRANDS.amazingmoon;

  // 2. Só quando o host não corresponde a nenhuma marca (ex.: URLs de preview
  //    do Vercel) é que o override por cookie é usado.
  if (cookieBrand && BRANDS[cookieBrand]) return BRANDS[cookieBrand];

  // 3. Por defeito.
  return DEFAULT_BRAND;
}
