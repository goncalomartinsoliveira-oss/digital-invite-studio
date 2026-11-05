// Centro de ajuda: tipos do conteúdo. Os artigos vivem em content/help/pt.ts e
// en.ts (não nos dicionários, que já são enormes). Para uma funcionalidade nova
// basta acrescentar um artigo aos dois ficheiros — ver "Como manter" no
// docs/MAPA-DO-PROJETO.md.
//
// Marcação permitida nos textos: **negrito** (nomes de botões e separadores,
// exatamente como aparecem no painel) e `código` (endereços de exemplo).

export type HelpChapterId =
  | "start" | "invite" | "save_the_date" | "guests" | "photos" | "guestbook" | "share" | "account" | "agencies";

// Quem vê o artigo: "all" todos; "dis" só no domínio da DIS (preços e compras,
// que num parceiro são tratados pelo próprio parceiro); "agency" é o capítulo
// para agências (visível a todos, claramente identificado).
export type HelpAudience = "all" | "dis" | "agency";

export type HelpArticle = {
  slug: string;
  chapter: HelpChapterId;
  audience?: HelpAudience;
  title: string;      // em forma de pergunta, como as pessoas a fazem
  summary: string;
  steps?: string[];
  tips?: string[];
  faq?: { q: string; a: string }[];
  related?: string[]; // slugs
  popular?: boolean;  // aparece em "Comecem por aqui"
};

export type HelpChapter = { id: HelpChapterId; title: string; desc: string; audience?: HelpAudience };

export type HelpUi = {
  eyebrow: string; title: string; subtitle: string; searchPlaceholder: string; searchLabel: string;
  noResults: string; resultsCount: string; articlesCount: string; popularTitle: string;
  stepsTitle: string; tipsTitle: string; faqTitle: string; relatedTitle: string; inThisChapter: string;
  backToHelp: string; stillNeedHelp: string; stillNeedHelpDesc: string; contactBtn: string; forAgenciesBadge: string;
  metaTitleSuffix: string; metaDescription: string;
};

export type HelpContent = { ui: HelpUi; chapters: HelpChapter[]; articles: HelpArticle[] };
