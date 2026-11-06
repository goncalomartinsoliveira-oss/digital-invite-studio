// Modo de experiência (antes de pagar o Plano Completo): o casal pode testar
// as fotos e o livro de visitas com um limite de conteúdos. O limite é
// verificado no momento do envio (as páginas enviam direto para o Supabase);
// chega para experimentar, não para usar num casamento.
export const TRIAL_LIMIT = { photo_sharing: 5, guestbook: 5 } as const;

export type TrialKind = keyof typeof TRIAL_LIMIT;

// Do lado do cliente: quantos envios ainda cabem (Infinity se já está pago).
// Em caso de erro deixa enviar — o limite é para experimentar, não um cofre.
export async function trialRemaining(invitationId: string, kind: TrialKind): Promise<number> {
  try {
    const res = await fetch(`/api/trial?inv=${encodeURIComponent(invitationId)}`, { cache: "no-store" });
    if (!res.ok) return Infinity;
    const j = await res.json();
    if (j.unlocked?.[kind]) return Infinity;
    const used = kind === "photo_sharing" ? j.photos : j.messages;
    return Math.max(0, TRIAL_LIMIT[kind] - (used || 0));
  } catch {
    return Infinity;
  }
}
