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
