"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, ExternalLink, ChevronRight } from "lucide-react";
import type { HelpContent } from "@/content/help/types";
import { visibleArticles } from "@/lib/help";
import ArticleBody from "./ArticleBody";
import RichText from "./RichText";

// Gaveta de ajuda dentro do painel: mostra o artigo certo sem sair do editor.
// O conteúdo (content/help) só é descarregado quando se abre a gaveta pela
// primeira vez, e só o do idioma em uso — não pesa no resto do painel.

const loaders: Record<string, () => Promise<HelpContent>> = {
  pt: () => import("@/content/help/pt").then(m => m.helpPt),
  en: () => import("@/content/help/en").then(m => m.helpEn),
};
const cache = new Map<string, Promise<HelpContent>>();
function loadContent(locale: string): Promise<HelpContent> {
  const key = locale === "en" ? "en" : "pt";
  let p = cache.get(key);
  if (!p) { p = loaders[key](); cache.set(key, p); }
  return p;
}

type Props = {
  slug: string | null;           // null = fechada
  locale: string;
  brandId: string;               // para esconder artigos de compras em parceiros
  onClose: () => void;
  onNavigate: (slug: string) => void;
};

export default function HelpDrawer({ slug, locale, brandId, onClose, onNavigate }: Props) {
  const [content, setContent] = useState<HelpContent | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const open = slug !== null;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadContent(locale).then(c => { if (!cancelled) setContent(c); });
    return () => { cancelled = true; };
  }, [open, locale]);

  // Foco: entra no botão de fechar, volta ao elemento que abriu a gaveta.
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => { returnFocus.current?.focus?.(); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Ao mudar de artigo dentro da gaveta, volta ao topo.
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [slug]);

  if (!open) return null;

  const articles = content ? visibleArticles(content, brandId) : [];
  const article = articles.find(a => a.slug === slug);
  const chapter = content && article ? content.chapters.find(c => c.id === article.chapter) : null;
  const related = article ? (article.related ?? []).map(s => articles.find(a => a.slug === s)).filter(Boolean) as typeof articles : [];
  const ui = content?.ui;

  return (
    <div className="fixed inset-0 z-[300]" data-help-drawer>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={article ? article.title.replace(/\*\*|`/g, "") : "Ajuda"}
        className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-cream shadow-2xl flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
          <div className="min-w-0">
            {chapter && <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand/80 mb-1.5">{chapter.title}</p>}
            <h2 className="font-serif text-2xl text-ink leading-snug">
              {article ? article.title.replace(/\*\*|`/g, "") : ui ? "" : "…"}
            </h2>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={ui?.drawerClose ?? "Fechar"}
            className="shrink-0 w-9 h-9 rounded-full bg-gray-50 text-gray-400 hover:bg-brand hover:text-white flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-6">
          {!content && <p className="text-sm text-gray-400">…</p>}
          {content && !article && <p className="text-sm text-gray-500">{content.ui.drawerMissing}</p>}
          {content && article && ui && (
            <>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-8"><RichText text={article.summary} /></p>
              <ArticleBody article={article} ui={ui} locale={locale === "en" ? "en" : "pt"} />
              {related.length > 0 && (
                <section className="mb-8">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand mb-3">{ui.relatedTitle}</h3>
                  <ul className="space-y-1.5">
                    {related.map(r => (
                      <li key={r.slug}>
                        <button onClick={() => onNavigate(r.slug)} className="inline-flex items-center gap-2 text-[14px] text-gray-600 hover:text-brand text-left">
                          <ChevronRight size={14} className="text-gold shrink-0" /> {r.title.replace(/\*\*|`/g, "")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {article && ui && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            <Link
              href={`/${locale === "en" ? "en" : "pt"}/help/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand hover:text-brand-dark"
            >
              {ui.drawerOpenInCenter} <ExternalLink size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
