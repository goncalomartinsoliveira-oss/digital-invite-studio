import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveBrand } from "@/lib/brands";
import { FEATURE_SLUGS } from "./[locale]/features/slugs";
import { visibleArticles } from "@/lib/help";
import { getHelp } from "@/lib/helpContent";

const LOCALES = ["pt", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("host") || "www.digitalinvitestudio.com";
  const brand = resolveBrand(host);
  const base = `https://${host}`;

  const paths = ["", "/features", "/contact", "/terms", "/privacy", "/cookies"];
  if (brand.id === "dis") paths.push("/pricing", "/partners");
  for (const slug of Object.values(FEATURE_SLUGS)) paths.push(`/features/${slug}`);
  paths.push("/help");
  // Os artigos de ajuda são iguais nos dois idiomas (mesmos slugs); filtrados pela marca.
  for (const art of visibleArticles(getHelp("pt"), brand.id)) paths.push(`/help/${art.slug}`);

  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];
  for (const path of paths) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${base}/${locale}${path}`,
        lastModified,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }
  return entries;
}
