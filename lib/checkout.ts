// Helper de checkout partilhado pelo lado do cliente — usado em qualquer
// ecrã de "módulo bloqueado" que ofereça um botão de compra direta.
export async function startModuleCheckout(params: {
  invitationId: string;
  slug: string;
  locale: string;
  moduleId: string;
  couponCode?: string;
}) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitationId: params.invitationId,
      slug: params.slug,
      locale: params.locale,
      moduleIds: [params.moduleId],
      couponCode: params.couponCode,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || "Erro ao iniciar o pagamento.");
  window.location.href = data.url;
}

export async function startBundleCheckout(params: {
  invitationId: string;
  slug: string;
  locale: string;
  bundleId: string;
  couponCode?: string;
}) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitationId: params.invitationId,
      slug: params.slug,
      locale: params.locale,
      bundleId: params.bundleId,
      couponCode: params.couponCode,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || "Erro ao iniciar o pagamento.");
  window.location.href = data.url;
}

export function formatPriceCents(cents: number, locale: string = "pt"): string {
  return new Intl.NumberFormat(locale === "en" ? "en-IE" : "pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
