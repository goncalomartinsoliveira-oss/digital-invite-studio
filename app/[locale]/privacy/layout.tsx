import type { Metadata } from "next";

const SEO = {
  pt: { title: "Política de Privacidade | Digital Invite Studio", desc: "Como a Digital Invite Studio recolhe, usa e protege os seus dados pessoais e os dos seus convidados." },
  en: { title: "Privacy Policy | Digital Invite Studio", desc: "How Digital Invite Studio collects, uses and protects your personal data and your guests' data." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const seo = SEO[locale === "pt" ? "pt" : "en"];
  return { title: seo.title, description: seo.desc };
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
