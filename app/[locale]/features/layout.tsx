import type { Metadata } from "next";
import pt from "@/dictionaries/pt";
import en from "@/dictionaries/en";

const dictionaries = { pt, en };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = dictionaries[locale === "pt" ? "pt" : "en"].DetailedFeaturesPage.hero;
  return { title: `${dict.title1} ${dict.title2} | Digital Invite Studio`, description: dict.desc };
}

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
