import type { Metadata } from "next";

const SEO = {
  pt: { title: "Termos e Condições | Digital Invite Studio", desc: "Termos e condições de utilização da plataforma Digital Invite Studio." },
  en: { title: "Terms and Conditions | Digital Invite Studio", desc: "Terms and conditions for using the Digital Invite Studio platform." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const seo = SEO[locale === "pt" ? "pt" : "en"];
  return { title: seo.title, description: seo.desc };
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
