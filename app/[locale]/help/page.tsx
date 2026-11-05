import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import Link from "next/link";
import { resolveBrand } from "@/lib/brands";
import { getHelp, chaptersWithArticles, visibleArticles, buildSearchIndex } from "@/lib/help";
import HelpBrowser from "@/components/help/HelpBrowser";
import { Eyebrow } from "@/components/site/Eyebrow";

async function currentBrand() {
  const h = await headers();
  const c = await cookies();
  return resolveBrand(h.get("host") ?? "", c.get("brand")?.value);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ui = getHelp(locale).ui;
  const brand = await currentBrand();
  return { title: `${ui.title} | ${brand.name}`, description: ui.metaDescription };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "pt";
  const content = getHelp(locale);
  const brand = await currentBrand();
  const groups = chaptersWithArticles(content, brand.id);
  const visible = visibleArticles(content, brand.id);
  const contactHref = brand.contactUrl ?? `/${locale}/contact`;
  const ui = content.ui;

  return (
    <div className="min-h-screen bg-cream pt-32 pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="mb-6"><Eyebrow>{ui.eyebrow}</Eyebrow></div>
          <h1 className="text-4xl md:text-6xl font-serif text-ink mb-5 leading-tight">{ui.title}</h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">{ui.subtitle}</p>
        </div>

        <HelpBrowser
          locale={locale}
          index={buildSearchIndex(visible, content.chapters)}
          popular={visible.filter(a => a.popular).map(a => ({ slug: a.slug, title: a.title.replace(/\*\*|`/g, "") }))}
          chapters={groups.map(g => ({
            id: g.chapter.id,
            title: g.chapter.title,
            desc: g.chapter.desc,
            agency: g.chapter.id === "agencies",
            articles: g.articles.map(a => ({ slug: a.slug, title: a.title.replace(/\*\*|`/g, "") })),
          }))}
          ui={ui}
        />

        <div className="mt-20 max-w-3xl mx-auto bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
          <h2 className="font-serif text-2xl text-ink mb-2">{ui.stillNeedHelp}</h2>
          <p className="text-gray-500 text-sm mb-6">{ui.stillNeedHelpDesc}</p>
          {brand.contactUrl ? (
            <a href={contactHref} target="_blank" rel="noopener noreferrer" className="inline-block bg-brand text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-dark transition-colors">{ui.contactBtn}</a>
          ) : (
            <Link href={contactHref} className="inline-block bg-brand text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-dark transition-colors">{ui.contactBtn}</Link>
          )}
        </div>
      </div>
    </div>
  );
}
