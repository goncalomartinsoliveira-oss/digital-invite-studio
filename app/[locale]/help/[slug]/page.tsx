import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { resolveBrand } from "@/lib/brands";
import { visibleArticles, faqJsonLd } from "@/lib/help";
import { getHelp } from "@/lib/helpContent";
import RichText from "@/components/help/RichText";
import ArticleBody from "@/components/help/ArticleBody";

async function currentBrand() {
  const h = await headers();
  const c = await cookies();
  return resolveBrand(h.get("host") ?? "", c.get("brand")?.value);
}

const plain = (s: string) => s.replace(/\*\*|`/g, "");

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const content = getHelp(locale);
  const brand = await currentBrand();
  const article = visibleArticles(content, brand.id).find(a => a.slug === slug);
  if (!article) return { title: content.ui.title };
  return { title: `${plain(article.title)} | ${brand.name}`, description: plain(article.summary) };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale === "en" ? "en" : "pt";
  const content = getHelp(locale);
  const brand = await currentBrand();
  const visible = visibleArticles(content, brand.id);
  const article = visible.find(a => a.slug === slug);
  if (!article) notFound();

  const ui = content.ui;
  const chapter = content.chapters.find(c => c.id === article.chapter)!;
  const siblings = visible.filter(a => a.chapter === article.chapter);
  const related = (article.related ?? []).map(s => visible.find(a => a.slug === s)).filter(Boolean) as typeof visible;
  const contactHref = brand.contactUrl ?? `/${locale}/contact`;
  const ctaCls = "inline-block bg-brand text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-dark transition-colors";

  return (
    <div className="min-h-screen bg-cream pt-32 pb-24 font-sans">
      {article.faq && article.faq.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(article.faq)) }} />
      )}
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[260px_1fr] gap-12">
        <aside className="hidden lg:block">
          <nav className="sticky top-28" aria-label={ui.inThisChapter}>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">{chapter.title}</p>
            <ul className="space-y-1 border-l border-gray-200">
              {siblings.map(s => (
                <li key={s.slug}>
                  <Link
                    href={`/${locale}/help/${s.slug}`}
                    aria-current={s.slug === article.slug ? "page" : undefined}
                    className={`block -ml-px pl-4 py-1.5 text-[13px] leading-snug border-l-2 transition-colors ${s.slug === article.slug ? "border-brand text-brand font-semibold" : "border-transparent text-gray-500 hover:text-brand"}`}
                  >
                    {plain(s.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 mb-6">
            <Link href={`/${locale}/help`} className="hover:text-brand">{ui.backToHelp}</Link>
            <ChevronRight size={12} />
            <span>{chapter.title}</span>
          </nav>

          {article.audience === "agency" && (
            <span className="inline-block text-[9px] font-bold uppercase tracking-widest bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-md mb-4">{ui.forAgenciesBadge}</span>
          )}
          <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight mb-4">{plain(article.title)}</h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-10"><RichText text={article.summary} /></p>

          <ArticleBody article={article} ui={ui} locale={locale} />

          {related.length > 0 && (
            <section className="mb-12">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand mb-4">{ui.relatedTitle}</h2>
              <ul className="space-y-2">
                {related.map(r => (
                  <li key={r.slug}>
                    <Link href={`/${locale}/help/${r.slug}`} className="inline-flex items-center gap-2 text-[14px] text-gray-600 hover:text-brand">
                      <ChevronRight size={14} className="text-gold" /> {plain(r.title)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
            <h2 className="font-serif text-2xl text-ink mb-2">{ui.stillNeedHelp}</h2>
            <p className="text-gray-500 text-sm mb-6">{ui.stillNeedHelpDesc}</p>
            {brand.contactUrl
              ? <a href={contactHref} target="_blank" rel="noopener noreferrer" className={ctaCls}>{ui.contactBtn}</a>
              : <Link href={contactHref} className={ctaCls}>{ui.contactBtn}</Link>}
          </div>
        </article>
      </div>
    </div>
  );
}
