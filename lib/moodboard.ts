export type MoodboardItemKind = "image" | "link";

export type MoodboardSection = {
  id: string;
  invitation_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

// Semeadas sozinhas na primeira vez que o evento abre a área de Inspiração
// (ver load() em MoodboardModule.tsx) — a agência/casal pode acrescentar
// secções próprias além destas, ou apagar as que não fizerem sentido.
export const DEFAULT_MOODBOARD_SECTIONS = [
  "Identidade Visual",
  "Vestido & Fato",
  "Convites & Papelaria",
  "Decoração & Cenografia",
  "Flores",
  "Cabelo & Maquilhagem",
  "Bolo & Doces",
  "Lembranças",
  "Fotografia & Vídeo",
];

// Link de partilha do Moodboard — ver + contribuir, sem conta DIS. Ao
// contrário do vendor_portal_links, não tem "kind": é sempre um por evento,
// sempre a mesma coisa (ver lib/moodboardShare.ts e 0007_moodboard_share.sql).
export type MoodboardShareLink = {
  id: string;
  invitation_id: string;
  token: string;
  expires_at: string;
  created_by_email: string | null;
  created_at: string;
};

// Travão simples contra spam no link público — sem infraestrutura de
// rate-limiting nesta app, um limite total por moodboard é a defesa
// pragmática (ver app/api/moodboard/public).
export const MOODBOARD_PUBLIC_ITEM_LIMIT = 300;

// Ponte entre o Orçamento e a Inspiração: a categoria de uma linha de custo
// aponta para a secção do moodboard com o mesmo assunto, para quem está a
// negociar com a florista conseguir abrir as inspirações de flores sem as ir
// procurar. Feito por nome (e não por id) porque as secções são criadas por
// evento; se a agência renomear ou apagar a secção, a ligação simplesmente
// deixa de aparecer, que é a degradação certa.
//
// Nem todas as categorias têm par — espaço, bebidas, música ou honorários não
// são assuntos visuais, e ficar de fora é melhor do que forçar um par pobre.
export const COST_CATEGORY_TO_SECTION: Record<string, string> = {
  decoracao: "Decoração & Cenografia",
  flores: "Flores",
  fotografia: "Fotografia & Vídeo",
  video: "Fotografia & Vídeo",
  bolo: "Bolo & Doces",
  convites: "Convites & Papelaria",
  beleza: "Cabelo & Maquilhagem",
  vestuario: "Vestido & Fato",
};

export type MoodboardItem = {
  id: string;
  invitation_id: string;
  section_id: string | null;
  kind: MoodboardItemKind;
  image_url: string | null;
  source_url: string | null;
  caption: string | null;
  created_by_email: string | null;
  created_at: string;
};

/** Domínio de um link colado (ex.: "pinterest.com"), para o cartão de fallback quando não há miniatura. */
export function moodboardItemDomain(item: Pick<MoodboardItem, "source_url">): string {
  if (!item.source_url) return "";
  try {
    return new URL(item.source_url).hostname.replace(/^www\./, "");
  } catch {
    return item.source_url;
  }
}
