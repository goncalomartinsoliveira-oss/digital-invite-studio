export type MoodboardItemKind = "image" | "link";

export type MoodboardItem = {
  id: string;
  invitation_id: string;
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
