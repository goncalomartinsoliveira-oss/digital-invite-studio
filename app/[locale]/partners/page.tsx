"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Globe, Sparkles, Loader2, ChevronDown, Mail, Megaphone, Tag, ClipboardList } from "lucide-react";
import { useBrand } from "@/components/site/BrandProvider";
import { Eyebrow } from "@/components/site/Eyebrow";
import { INVITE_TEMPLATES } from "@/lib/templates";

import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = { pt, en };

// Página para wedding planners e agências: o Planeamento (com capturas reais,
// public/partners/*.jpg, geradas no simulador com a agência fictícia "Atelier
// Lua"), o que os noivos recebem, a marca própria, as três formas de parceria
// (recomendar, revender, wedding planner) e perguntas frequentes. Sem valores
// nem percentagens: cada forma tem "Pedir condições" (contacto com o tipo
// pré-preenchido) e as condições enviam-se por e-mail.

export default function PartnersPage() {
  const params = useParams();
  const router = useRouter();
  const brand = useBrand();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = dictionaries[locale]?.PartnersPage || dictionaries.pt.PartnersPage;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Proposta B2B "torne-se parceiro DIS" não faz sentido num domínio que já
  // é de um parceiro (marca própria).
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

  const demoHref = `/${locale}/contact?assunto=parceria`;
  const featured = INVITE_TEMPLATES[0];

  return (
    <div className="min-h-screen bg-cream font-sans">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-0 px-6 bg-ink text-white overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Eyebrow tone="gold">{dict.hero.tag}</Eyebrow>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-[3.4rem] font-serif mb-6 leading-tight text-gold-soft"
          >
            {dict.hero.title} <br className="hidden md:block" /><span className="italic text-gold">{dict.hero.titleAccent}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/70 text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {dict.hero.desc}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href={demoHref} className="inline-flex items-center gap-2 bg-gold-soft text-ink px-8 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg">
              {dict.hero.ctaPrimary} <ArrowRight size={14} />
            </Link>
            <a href="#parcerias" className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
              {dict.hero.ctaSecondary}
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="rounded-t-[1.6rem] overflow-hidden border border-white/10 border-b-0 shadow-2xl bg-cream"
          >
            <img src="/partners/week.jpg" alt={dict.planning.items[0].title} className="w-full h-auto block" />
          </motion.div>
        </div>
      </section>

      {/* ── PLANEAMENTO ──────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <Eyebrow>{dict.planning.tag}</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl text-ink">{dict.planning.title}</h2>
            <p className="text-gray-500 text-lg">{dict.planning.desc}</p>
          </div>

          <div className="space-y-24">
            {(dict.planning.items as { key: string; title: string; desc: string }[]).slice(1).map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                className={`grid lg:grid-cols-[1fr_1.35fr] gap-10 lg:gap-16 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="space-y-4">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-brand text-gold-soft font-serif text-sm">{i + 1}</span>
                  <h3 className="font-serif text-3xl text-ink">{item.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
                </div>
                <div className="rounded-[1.6rem] overflow-hidden border border-gold-soft/60 shadow-xl bg-white">
                  <img src={`/partners/${item.key}.jpg`} alt={item.title} loading="lazy" className="w-full h-auto block" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-12">
            <h3 className="font-serif text-2xl text-ink mb-6">{dict.extras.title}</h3>
            <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
              {(dict.extras.items as string[]).map(x => (
                <li key={x} className="flex items-start gap-3 text-sm text-ink/85 leading-relaxed">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0"><Check size={11} strokeWidth={3.5} /></span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── O QUE OS NOIVOS RECEBEM ──────────────────────────────────── */}
      <section className="bg-white border-y border-gold-soft/60 py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="relative h-[420px] flex justify-center">
            <div className="absolute inset-x-10 inset-y-6 bg-gold-soft/40 rounded-[3rem] rotate-[-4deg]" />
            <div className="absolute top-0 right-10 w-[190px] rounded-[2.2rem] border-[7px] border-ink overflow-hidden shadow-2xl rotate-[6deg]">
              <img src="/home/rb-open.jpg" alt="" className="w-full h-auto block" loading="lazy" />
            </div>
            <div className="absolute bottom-0 left-10 w-[210px] rounded-[2.2rem] border-[7px] border-ink overflow-hidden shadow-2xl rotate-[-3deg]">
              <img src="/home/tpl-renaissance-blue-01.jpg" alt="" className="w-full h-auto block" loading="lazy" />
            </div>
          </div>
          <div className="space-y-6 text-center lg:text-left">
            <Eyebrow align="left">{dict.couples.tag}</Eyebrow>
            <h2 className="font-serif text-3xl md:text-4xl text-ink">{dict.couples.title}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">{dict.couples.desc}</p>
            {featured && (
              <Link href={`/${locale}/preview/${featured.id}`} className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand border-b border-brand pb-1 hover:text-ink">
                {dict.couples.cta} <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── MARCA PRÓPRIA ────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">{dict.modelsTitle}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{dict.modelsSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {(["domain", "light"] as const).map((key, i) => {
              const m = dict.models[key];
              const Icon = key === "domain" ? Globe : Sparkles;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-cream border border-gold-soft/60 text-brand flex items-center justify-center mb-6"><Icon size={22} /></div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-2">{m.subtitle}</p>
                  <h3 className="font-serif text-2xl text-ink mb-4">{m.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">{m.desc}</p>
                  <ul className="space-y-3">
                    {(m.features as string[]).map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                        <Check size={15} className="text-brand shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FORMAS DE PARCERIA (sem valores: as condições enviam-se a pedido) ── */}
      <section id="parcerias" className="bg-ink py-24 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <Eyebrow tone="gold">{dict.ways.tag}</Eyebrow>
            <h2 className="font-serif text-3xl md:text-4xl text-gold-soft">{dict.ways.title}</h2>
            <p className="text-gray-400">{dict.ways.desc}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(dict.ways.items as { key: string; title: string; who: string; desc: string }[]).map((w, i) => {
              const Icon = [Megaphone, Tag, ClipboardList][i] ?? Sparkles;
              const featuredWay = w.key === "wedding-planner";
              return (
                <motion.div
                  key={w.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex flex-col rounded-[2rem] p-8 ${featuredWay ? "bg-cream text-ink shadow-2xl" : "bg-white/[0.04] border border-gold-soft/15 text-white"}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${featuredWay ? "bg-brand text-gold-soft" : "bg-gold-soft/10 text-gold-soft"}`}><Icon size={20} /></div>
                  <h3 className={`font-serif text-2xl mb-1 ${featuredWay ? "text-ink" : "text-gold-soft"}`}>{w.title}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${featuredWay ? "text-gold" : "text-gray-500"}`}>{w.who}</p>
                  <p className={`text-sm leading-relaxed flex-1 mb-6 ${featuredWay ? "text-gray-600" : "text-gray-400"}`}>{w.desc}</p>
                  <Link
                    href={`${demoHref}&tipo=${w.key}`}
                    className={`inline-flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${featuredWay ? "bg-brand text-gold-soft hover:bg-brand-dark" : "border border-gold-soft/30 text-gold-soft hover:bg-gold-soft/10"}`}
                  >
                    {dict.ways.cta} <ArrowRight size={13} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
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
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                      <p className="px-7 pb-6 pt-1 text-sm text-gray-500 leading-relaxed border-t border-gray-100">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="pb-28 px-6 text-center">
        <div className="max-w-3xl mx-auto bg-white rounded-[3rem] shadow-2xl p-10 md:p-16 space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-cream border border-gold-soft text-brand flex items-center justify-center"><Mail size={22} /></div>
          <h2 className="font-serif text-3xl md:text-4xl text-ink">{dict.finalTitle}</h2>
          <p className="text-gray-600 text-lg">{dict.finalDesc}</p>
          <Link href={demoHref} className="inline-flex items-center gap-2 bg-brand text-gold-soft px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-dark transition-colors">
            {dict.finalCta} <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
