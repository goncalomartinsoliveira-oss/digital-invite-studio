import React from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import type { HelpArticle, HelpUi } from "@/content/help/types";
import RichText from "./RichText";

// Corpo de um artigo de ajuda (capturas, passos, dicas e perguntas frequentes).
// Partilhado entre a página /help/<slug> (servidor) e a gaveta de ajuda do painel
// (cliente), por isso não usa estado nem hooks: o FAQ são <details> nativos.

export default function ArticleBody({ article, ui, locale }: { article: HelpArticle; ui: HelpUi; locale: string }) {
  return (
    <>
      {article.shots && article.shots.length > 0 && (
        <div className="mb-10 space-y-6">
          {article.shots.map(shot => (
            <figure key={shot.file} data-help-shot className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/help/${locale}/${shot.file}.webp`}
                alt={shot.alt}
                loading="lazy"
                className="w-full h-auto rounded-xl"
              />
              {shot.caption && <figcaption className="text-[12px] text-gray-400 text-center px-4 py-2">{shot.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      {article.steps && article.steps.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand mb-5">{ui.stepsTitle}</h2>
          <ol className="space-y-4">
            {article.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-brand text-white text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-[15px] text-gray-600 leading-relaxed pt-1"><RichText text={s} /></p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {article.tips && article.tips.length > 0 && (
        <section className="mb-10 bg-white border border-gold-soft/70 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand mb-4"><Lightbulb size={14} /> {ui.tipsTitle}</h2>
          <ul className="space-y-3">
            {article.tips.map((t, i) => (
              <li key={i} className="flex gap-3 text-[14px] text-gray-600 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                <span><RichText text={t} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {article.faq && article.faq.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand mb-4">{ui.faqTitle}</h2>
          <div className="space-y-3">
            {article.faq.map((f, i) => (
              <details key={i} className="group bg-white border border-gray-100 rounded-2xl px-6 py-4 open:shadow-sm">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-ink text-[15px]">
                  <span><RichText text={f.q} /></span>
                  <ChevronDown size={16} className="text-brand shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-[14px] text-gray-600 leading-relaxed mt-3"><RichText text={f.a} /></p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
