import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { resolveBrand } from "@/lib/brands";

const SEO = {
  pt: { title: "Para Agências e Wedding Planners | Digital Invite Studio", desc: "Leve a Digital Invite Studio para a sua marca: convites digitais, RSVP inteligente, plano de mesas, partilha de fotos e guestbook com a identidade da vossa agência, geridos a partir de um único painel." },
  en: { title: "For Agencies and Wedding Planners | Digital Invite Studio", desc: "Bring Digital Invite Studio to your own brand: digital invitations, smart RSVP, seating charts, photo sharing and guestbook under your agency's identity, managed from a single dashboard." },
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

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
