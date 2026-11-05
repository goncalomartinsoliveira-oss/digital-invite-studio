"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Rocket, CalendarHeart, Mail, Users, Camera, MessageSquareHeart, Link2, UserCircle, Briefcase } from "lucide-react";
import { searchHelp, type HelpSearchEntry } from "@/lib/help";

// Página inicial do centro de ajuda: pesquisa (no próprio browser, sem
// servidor) e os capítulos. Enquanto se pesquisa, os resultados substituem os
// capítulos.

const ICONS: Record<string, React.ReactNode> = {
  start: <Rocket size={22} />, invite: <Mail size={22} />, save_the_date: <CalendarHeart size={22} />,
  guests: <Users size={22} />, photos: <Camera size={22} />, guestbook: <MessageSquareHeart size={22} />,
  share: <Link2 size={22} />, account: <UserCircle size={22} />, agencies: <Briefcase size={22} />,
};

type Props = {
  locale: string;
  index: HelpSearchEntry[];
  popular: { slug: string; title: string }[];
  chapters: { id: string; title: string; desc: string; agency: boolean; articles: { slug: string; title: string }[] }[];
  ui: { searchPlaceholder: string; searchLabel: string; noResults: string; resultsCount: string; articlesCount: string; popularTitle: string; forAgenciesBadge: string };
};

export default function HelpBrowser({ locale, index, popular, chapters, ui }: Props) {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchHelp(index, q), [index, q]);
  const searching = q.trim().length >= 2;

  return (
    <div>
      <div className="relative max-w-2xl mx-auto">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          aria-label={ui.searchLabel}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={ui.searchPlaceholder}
          className="w-full bg-white border border-gray-200 rounded-full pl-14 pr-6 py-4 text-sm outline-none focus:border-brand shadow-sm transition-colors"
        />
      </div>

      {searching ? (
        <div data-help-results className="max-w-3xl mx-auto mt-12">
          {results.length === 0 ? (
            <p className="text-center text-gray-500">{ui.noResults.replace("{q}", q.trim())}</p>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">{ui.resultsCount.replace("{n}", String(results.length))}</p>
              <ul className="space-y-3">
                {results.map(r => (
                  <li key={r.slug}>
                    <Link href={`/${locale}/help/${r.slug}`} className="block bg-white border border-gray-100 rounded-2xl p-5 hover:border-gold-soft hover:shadow-md transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand/80">{r.chapter}</span>
                      <span className="block font-serif text-xl text-ink mt-1">{r.title}</span>
                      <span className="block text-sm text-gray-500 mt-1">{r.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <>
          {popular.length > 0 && (
            <div className="max-w-3xl mx-auto mt-12">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-5">{ui.popularTitle}</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {popular.map(p => (
                  <Link key={p.slug} href={`/${locale}/help/${p.slug}`} className="bg-white border border-gray-200 text-gray-600 px-5 py-2.5 rounded-full text-[13px] hover:text-brand hover:border-gold-soft transition-all">
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {chapters.map(c => (
              <section key={c.id} data-chapter={c.id} className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <span className="w-12 h-12 rounded-2xl bg-cream border border-gold-soft/70 flex items-center justify-center text-brand shrink-0">{ICONS[c.id]}</span>
                  <div className="min-w-0">
                    <h2 className="font-serif text-xl text-ink leading-tight">{c.title}</h2>
                    {c.agency && <span className="text-[9px] font-bold uppercase tracking-widest bg-gray-50 text-gray-400 px-2 py-0.5 rounded-md">{ui.forAgenciesBadge}</span>}
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{c.desc}</p>
                <ul className="space-y-1 mt-auto">
                  {c.articles.map(a => (
                    <li key={a.slug}>
                      <Link href={`/${locale}/help/${a.slug}`} className="group flex items-start gap-2 py-1.5 text-[13px] text-gray-600 hover:text-brand transition-colors">
                        <ArrowRight size={13} className="mt-1 shrink-0 text-gold group-hover:translate-x-0.5 transition-transform" />
                        <span>{a.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
