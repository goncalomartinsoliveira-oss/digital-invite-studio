import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { resolveBrand } from "@/lib/brands";

const SEO = {
  pt: { title: "Para Wedding Planners e Agências | Digital Invite Studio", desc: "Orçamento, fornecedores, tarefas e cronograma de todos os casamentos num só painel, e convites digitais com a vossa marca para cada casal. Recomendação, revenda e marca própria, sem mensalidades." },
  en: { title: "For Wedding Planners and Agencies | Digital Invite Studio", desc: "Budget, vendors, tasks and timeline for every wedding in one dashboard, and digital invitations with your brand for every couple. Referrals, resale and your own brand, no subscriptions." },
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
