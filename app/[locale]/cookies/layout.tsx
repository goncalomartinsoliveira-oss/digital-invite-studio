import type { Metadata } from "next";

const SEO = {
  pt: { title: "Política de Cookies | Digital Invite Studio", desc: "O que são cookies, como a Digital Invite Studio os utiliza e como pode geri-los." },
  en: { title: "Cookies Policy | Digital Invite Studio", desc: "What cookies are, how Digital Invite Studio uses them, and how you can manage them." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const seo = SEO[locale === "pt" ? "pt" : "en"];
  return { title: seo.title, description: seo.desc };
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
