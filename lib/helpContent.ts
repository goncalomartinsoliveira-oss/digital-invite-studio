import type { HelpContent } from "@/content/help/types";
import { helpPt } from "@/content/help/pt";
import { helpEn } from "@/content/help/en";

// Acesso ao conteúdo do centro de ajuda para código de SERVIDOR (páginas e
// sitemap). Os componentes de cliente não devem importar isto: levariam os
// textos dos dois idiomas no bundle.
export function getHelp(locale: string): HelpContent {
  return locale === "en" ? helpEn : helpPt;
}
