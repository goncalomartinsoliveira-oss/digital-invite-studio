// Verifica a coerência do centro de ajuda. Correr na raiz do projeto:
//   npx tsx scripts/check-help-content.ts
// Sai com código 1 se encontrar problemas. Convém correr sempre que se mexer em
// content/help/*.ts, em TAB_HELP/CHECKLIST_HELP (lib/help.ts) ou em public/help/.
import fs from "fs";
import path from "path";
import { helpPt } from "../content/help/pt";
import { helpEn } from "../content/help/en";
import { TAB_HELP, CHECKLIST_HELP } from "../lib/help";

const root = path.resolve(__dirname, "..");
const errs: string[] = [];

const slugsPt = helpPt.articles.map(a => a.slug);
if (slugsPt.join() !== helpEn.articles.map(a => a.slug).join()) errs.push("PT e EN têm slugs (ou ordem) diferentes");
const slugSet = new Set(slugsPt);

for (const [k, v] of Object.entries({ ...TAB_HELP, ...CHECKLIST_HELP })) {
  if (!slugSet.has(v)) errs.push(`lib/help.ts: "${k}" aponta para um artigo que não existe (${v})`);
}

for (const [loc, h] of [["pt", helpPt], ["en", helpEn]] as const) {
  const chapters = new Set(h.chapters.map(c => c.id));
  if (new Set(h.articles.map(a => a.slug)).size !== h.articles.length) errs.push(`${loc}: slugs repetidos`);
  for (const c of h.chapters) if (!h.articles.some(a => a.chapter === c.id)) errs.push(`${loc}: capítulo vazio ${c.id}`);
  for (const a of h.articles) {
    const at = `${loc}/${a.slug}`;
    if (!chapters.has(a.chapter)) errs.push(`${at}: capítulo desconhecido ${a.chapter}`);
    for (const r of a.related ?? []) if (!slugSet.has(r)) errs.push(`${at}: "related" ${r} não existe`);
    const texts = [a.title, a.summary, ...(a.steps ?? []), ...(a.tips ?? []), ...(a.faq ?? []).flatMap(f => [f.q, f.a])];
    for (const t of texts) {
      if ((t.match(/\*\*/g) || []).length % 2) errs.push(`${at}: ** por fechar em "${t.slice(0, 40)}"`);
      if ((t.match(/`/g) || []).length % 2) errs.push(`${at}: \` por fechar em "${t.slice(0, 40)}"`);
    }
    if (!a.steps?.length && !a.tips?.length) errs.push(`${at}: sem passos nem dicas`);
    for (const s of a.shots ?? []) {
      if (!fs.existsSync(path.join(root, "public/help", loc, `${s.file}.webp`))) errs.push(`${at}: falta a imagem ${loc}/${s.file}.webp`);
      if (!s.alt || s.alt.length < 10) errs.push(`${at}: texto alternativo fraco em ${s.file}`);
    }
  }
}

const shotsOf = (h: typeof helpPt) => h.articles.flatMap(a => (a.shots ?? []).map(s => s.file));
if (shotsOf(helpPt).join() !== shotsOf(helpEn).join()) errs.push("PT e EN usam capturas diferentes");
const used = new Set(shotsOf(helpPt));
for (const loc of ["pt", "en"]) {
  const dir = path.join(root, "public/help", loc);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (!used.has(f.replace(/\.webp$/, ""))) errs.push(`${loc}: imagem sem artigo (${f})`);
}

if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log(`OK — ${slugsPt.length} artigos × 2 idiomas, ${used.size} capturas, mapeamentos válidos.`);
