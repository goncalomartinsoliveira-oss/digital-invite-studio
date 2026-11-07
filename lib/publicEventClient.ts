// Do lado do cliente: dados públicos de um evento pelo slug (api/public-event,
// migração 0020). Devolve null se não existir.
export type PublicEvent = {
  id: string;
  slug: string;
  brand_id: string | null;
  bride_name: string;
  groom_name: string;
  profile_image_url: string | null;
  expires_at: string | null;
  unlocked_modules: string[] | null;
};

export async function fetchPublicEvent(slug: string): Promise<PublicEvent | null> {
  try {
    const res = await fetch(`/api/public-event?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
