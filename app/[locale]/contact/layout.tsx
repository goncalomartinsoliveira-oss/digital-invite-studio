import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { resolveBrand } from "@/lib/brands";

const SEO = {
  pt: { title: "Contacto | Digital Invite Studio", desc: "Têm alguma dúvida ou precisam de uma solução personalizada para o vosso casamento? Fale connosco por email, WhatsApp ou Instagram." },
  en: { title: "Contact | Digital Invite Studio", desc: "Have a question or need a custom solution for your wedding? Reach us by email, WhatsApp or Instagram." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const h = await headers();
  const c = await cookies();
  const brand = resolveBrand(h.get("host") ?? "", c.get("brand")?.value);
  const seo = SEO[locale === "pt" ? "pt" : "en"];
  if (brand.id !== "dis") return { title: `${brand.name} — Contacto`, description: brand.tagline };
  return { title: seo.title, description: seo.desc };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
