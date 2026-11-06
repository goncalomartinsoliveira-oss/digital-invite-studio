import { supabase } from "@/lib/supabase";
import type { PlanQuote } from "@/lib/partnerPricing";

// Helper de checkout partilhado pelo lado do cliente. Desde nov. 2026 só se
// vende o Plano Completo (lib/pricing.ts → FULL_PLAN_ID). O preço vem sempre
// do servidor (api/checkout/quote), que sabe se quem paga é o parceiro.

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { authorization: `Bearer ${data.session.access_token}` } : {};
}

export type ClientPlanQuote = Partial<PlanQuote> & { payer: "couple" | "partner"; canBuy: boolean };

export async function fetchPlanQuote(invitationId: string): Promise<ClientPlanQuote | null> {
  try {
    const res = await fetch(`/api/checkout/quote?inv=${encodeURIComponent(invitationId)}`, { headers: await authHeader(), cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
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
