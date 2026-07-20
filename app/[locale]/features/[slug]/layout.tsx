import type { Metadata } from "next";
import pt from "@/dictionaries/pt";
import en from "@/dictionaries/en";
import { moduleIdFromSlug } from "../slugs";

const dictionaries = { pt, en };

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = dictionaries[locale === "pt" ? "pt" : "en"];
  const moduleId = moduleIdFromSlug(slug);
  if (!moduleId) return { title: "Digital Invite Studio" };
  const mod = dict.FeatureDetailPage.modules[moduleId];
  return { title: `${mod.title} | Digital Invite Studio`, description: mod.summary };
}

export default function FeatureDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
