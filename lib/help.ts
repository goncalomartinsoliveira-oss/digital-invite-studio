import type { HelpArticle, HelpChapter, HelpContent } from "@/content/help/types";
import { helpPt } from "@/content/help/pt";
import { helpEn } from "@/content/help/en";

// Centro de ajuda: acesso ao conteúdo, filtro por marca e pesquisa.
// Parte comum a servidor e cliente (sem dependências de servidor).

export function getHelp(locale: string): HelpContent {
  return locale === "en" ? helpEn : helpPt;
}

// Num domínio de parceiro os artigos de preços e compras não se aplicam (o
// parceiro trata disso com o casal) — ficam escondidos.
export function visibleArticles(content: HelpContent, brandId: string): HelpArticle[] {
  return content.articles.filter(a => (a.audience ?? "all") !== "dis" || brandId === "dis");
}

export function chaptersWithArticles(content: HelpContent, brandId: string): { chapter: HelpChapter; articles: HelpArticle[] }[] {
  const visible = visibleArticles(content, brandId);
  return content.chapters
    .map(chapter => ({ chapter, articles: visible.filter(a => a.chapter === chapter.id) }))
    .filter(c => c.articles.length > 0);
}

const strip = (s: string) => s.replace(/\*\*|`/g, "");

export function plainText(a: HelpArticle): string {
  return strip([a.title, a.summary, ...(a.steps ?? []), ...(a.tips ?? []), ...(a.faq ?? []).flatMap(f => [f.q, f.a])].join(" "));
}

export const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type HelpSearchEntry = { slug: string; chapter: string; title: string; summary: string; haystack: string; titleNorm: string };

export function buildSearchIndex(articles: HelpArticle[], chapters: HelpChapter[]): HelpSearchEntry[] {
  const chapterTitle = new Map(chapters.map(c => [c.id, c.title]));
  return articles.map(a => ({
    slug: a.slug,
    chapter: chapterTitle.get(a.chapter) ?? "",
    title: strip(a.title),
    summary: strip(a.summary),
    haystack: normalize(plainText(a)),
    titleNorm: normalize(strip(a.title)),
  }));
}

// Todas as palavras da pesquisa têm de existir no artigo; o título pesa mais.
export function searchHelp(index: HelpSearchEntry[], query: string): HelpSearchEntry[] {
  const words = normalize(query).split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return [];
  return index
    .map(e => ({ e, hit: words.every(w => e.haystack.includes(w)), score: words.reduce((n, w) => n + (e.titleNorm.includes(w) ? 3 : 1), 0) }))
    .filter(r => r.hit)
    .sort((a, b) => b.score - a.score)
    .map(r => r.e);
}

export function faqJsonLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(f => ({
      "@type": "Question",
      name: strip(f.q),
      acceptedAnswer: { "@type": "Answer", text: strip(f.a) },
    })),
  };
}
