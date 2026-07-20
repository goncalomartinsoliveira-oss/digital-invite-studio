import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { resolveBrand } from "@/lib/brands";

const SEO = {
  pt: { title: "Preços | Digital Invite Studio", desc: "Pagamento único por evento, sem mensalidades. Escolha um pacote com desconto (Convite, Momentos ou Completo) ou monte a sua combinação módulo a módulo." },
  en: { title: "Pricing | Digital Invite Studio", desc: "One-time payment per event, no subscriptions. Pick a discounted bundle (Invitation, Moments or Complete) or build your own combination module by module." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const h = await headers();
  const c = await cookies();
  const brand = resolveBrand(h.get("host") ?? "", c.get("brand")?.value);
  const seo = SEO[locale === "pt" ? "pt" : "en"];
  if (brand.id !== "dis") return { title: brand.name, description: brand.tagline };
  return { title: seo.title, description: seo.desc };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
