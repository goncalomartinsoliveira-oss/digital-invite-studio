import type { ModuleId } from "@/lib/modules";

// Slugs amigáveis para as páginas de detalhe de cada módulo em /features/<slug>.
export const FEATURE_SLUGS: Record<ModuleId, string> = {
  save_the_date: "save-the-date",
  invite: "convite-de-casamento",
  guests_seating: "convidados-e-mesas",
  photo_sharing: "photo-sharing-e-live-wall",
  guestbook: "guestbook",
};

export function moduleIdFromSlug(slug: string): ModuleId | undefined {
  return (Object.entries(FEATURE_SLUGS) as [ModuleId, string][]).find(([, s]) => s === slug)?.[0];
}
