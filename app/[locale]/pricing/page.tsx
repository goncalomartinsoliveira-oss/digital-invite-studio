"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles, ArrowRight, ChevronDown, Crown } from "lucide-react";
import { FULL_PLAN, FULL_PLAN_LIST_PRICE_CENTS, BESPOKE_FROM_CENTS, isLaunchPrice } from "@/lib/pricing";
import { INVITE_TEMPLATES } from "@/lib/templates";
import { formatPriceCents } from "@/lib/checkout";
import { useBrand } from "@/components/site/BrandProvider";
import { Eyebrow } from "@/components/site/Eyebrow";

import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = { pt, en };

// Página de Preços: um só produto para casais (Plano Completo), o convite à
// medida (orçamento) e uma faixa para wedding planners, que leva a /partners
// (onde estão os planos mensais). Os valores vêm de lib/pricing.ts, a mesma
// fonte do checkout e do painel.

export default function PricingPage() {
  const params = useParams();
  const router = useRouter();
  const brand = useBrand();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = dictionaries[locale]?.PricingPage || dictionaries.pt.PricingPage;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Preços e planos são coisa da DIS — num domínio de parceiro (marca
  // própria), esta página não faz sentido nenhum.
  useEffect(() => {
    if (brand.id !== "dis") router.replace(`/${locale}`);
  }, [brand.id, locale, router]);

  if (brand.id !== "dis") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  const launch = isLaunchPrice();
  const featured = INVITE_TEMPLATES[0];

  return (
    <div className="min-h-screen bg-cream pt-32 font-sans">
      {/* ── CABEÇALHO ────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-serif text-ink mb-6 leading-tight"
        >
          {dict.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed"
        >
          {dict.desc}
        </motion.p>
      </section>

      {/* ── CASAIS: COMPLETO + À MEDIDA ──────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 grid md:grid-cols-[1.15fr_1fr] gap-8 items-stretch mb-28">
        {/* Plano Completo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative flex flex-col bg-white border-2 border-brand rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
        >
          {launch && (
            <div className="absolute -top-4 left-8 bg-brand text-gold-soft text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-full shadow-md">
              {dict.full.launchLabel}
            </div>
          )}
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-2">{dict.full.tag}</p>
          <h2 className="font-serif text-3xl text-ink mb-5">{dict.full.name}</h2>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {launch && <span className="font-serif text-2xl text-gray-400 line-through">{formatPriceCents(FULL_PLAN_LIST_PRICE_CENTS, locale)}</span>}
            <span className="font-serif text-6xl text-brand">{formatPriceCents(FULL_PLAN.priceCents, locale)}</span>
            <span className="text-gray-400 text-sm">{dict.full.per}</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2 mb-8">{dict.full.note}</p>

          <ul className="space-y-3 mb-10 flex-1">
            {(dict.full.features as string[]).map(f => (
              <li key={f} className="flex items-start gap-3 text-sm text-ink/85">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shrink-0"><Check size={11} strokeWidth={3.5} /></span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href={`/${locale}/dashboard/new-invite`}
            className="w-full text-center py-4 rounded-full bg-brand text-gold-soft text-[11px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-dark transition-colors"
          >
            {dict.full.cta}
          </Link>
          {featured && (
            <Link href={`/${locale}/preview/${featured.id}`} className="mt-4 inline-flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand transition-colors">
              {dict.full.liveLink} <ArrowRight size={13} />
            </Link>
          )}
        </motion.div>

        {/* Convite à medida */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative flex flex-col bg-ink text-white rounded-[2.5rem] p-8 md:p-10 shadow-xl overflow-hidden"
        >
          <img src="/home/bespoke-hortensias.webp" alt="" className="absolute -right-10 -bottom-10 w-56 opacity-20 pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-2 flex items-center gap-2"><Crown size={13} /> {dict.bespoke.tag}</p>
          <h2 className="font-serif text-3xl text-gold-soft mb-5">{dict.bespoke.name}</h2>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-gray-400 text-sm">{dict.bespoke.from}</span>
            <span className="font-serif text-5xl text-white">{formatPriceCents(BESPOKE_FROM_CENTS, locale)}</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mt-2 mb-8">{dict.bespoke.note}</p>

          <ul className="space-y-3 mb-10 flex-1 relative">
            {(dict.bespoke.features as string[]).map(f => (
              <li key={f} className="flex items-start gap-3 text-sm text-white/85">
                <Sparkles size={15} className="text-gold shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>

          <Link
            href={`/${locale}/contact?assunto=medida`}
            className="relative w-full text-center py-4 rounded-full bg-gold text-ink text-[11px] font-bold uppercase tracking-widest hover:bg-[#C9A96E] transition-colors"
          >
            {dict.bespoke.cta}
          </Link>
        </motion.div>
      </section>

      {/* ── WEDDING PLANNERS: só uma faixa; planos e preços em /partners ── */}
      <section className="px-6 pb-4">
        <div className="max-w-5xl mx-auto bg-brand rounded-[2.5rem] px-8 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-soft/80">{dict.wp.tag}</p>
            <h2 className="font-serif text-2xl md:text-3xl text-white">{dict.wp.title}</h2>
            <p className="text-white/70 leading-relaxed">{dict.wp.desc}</p>
          </div>
          <Link
            href={`/${locale}/partners`}
            className="shrink-0 inline-flex items-center gap-2 bg-gold-soft text-brand px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-white transition-colors shadow-lg"
          >
            {dict.wp.cta} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-ink text-center mb-12">{dict.faq.title}</h2>
          <div className="space-y-3">
            {(dict.faq.items as { q: string; a: string }[]).map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between px-7 py-5 text-left hover:bg-cream transition-colors"
                >
                  <span className="font-semibold text-ink text-sm pr-6">{item.q}</span>
                  <ChevronDown size={18} className={`text-brand shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-7 pb-6 pt-1 text-sm text-gray-500 leading-relaxed border-t border-gray-100">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
