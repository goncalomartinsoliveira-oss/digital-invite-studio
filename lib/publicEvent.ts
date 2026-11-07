// Dados públicos de um evento (migração 0020: a tabela invitations deixou de
// ser legível com a chave pública). Só servidor: as páginas públicas recebem
// apenas estes campos, nunca o registo inteiro (e-mail dos noivos, orçamento,
// quem paga, recomendação, código de acesso…).

// O que os templates do convite usam (data.<campo>). Acrescentar aqui um campo
// novo que um template precise de mostrar.
export const INVITE_PAGE_FIELDS = [
  "id", "slug", "template_id", "brand_id",
  "bride_name", "groom_name", "event_date",
  "content", "main_image_url", "story_image_url", "profile_image_url",
  "bride_phone", "groom_phone",
  "unlocked_modules", "expires_at", "dietary_tags",
] as const;

// O que as páginas de fotos, Live Wall, livro de visitas, RSVP e mesas usam.
export const PUBLIC_EVENT_FIELDS = [
  "id", "slug", "brand_id", "bride_name", "groom_name", "profile_image_url",
  "expires_at", "unlocked_modules",
] as const;

export function pickFields<T extends Record<string, any>>(row: T, fields: readonly string[]): Partial<T> {
  const out: Record<string, any> = {};
  for (const f of fields) if (f in row) out[f] = row[f];
  return out as Partial<T>;
}
