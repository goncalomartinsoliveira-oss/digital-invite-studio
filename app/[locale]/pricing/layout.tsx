import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { resolveBrand } from "@/lib/brands";

const SEO = {
  pt: { title: "Preços | Digital Invite Studio", desc: "Um só preço com tudo incluído: convite digital, RSVP, convidados e mesas, Save the Date, fotos e livro de visitas. Pagamento único por evento. Também convites à medida e planos para wedding planners." },
  en: { title: "Pricing | Digital Invite Studio", desc: "One price with everything included: digital invitation, RSVP, guests and seating, Save the Date, photos and guestbook. One-time payment per event. Also bespoke invitations and plans for wedding planners." },
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
