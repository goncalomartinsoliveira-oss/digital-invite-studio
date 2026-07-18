"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Check, Globe, Sparkles, LayoutDashboard, Users, Package, Palette, Building2
} from "lucide-react";

// 1. IMPORTAR OS DICIONÁRIOS (3 níveis para trás)
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = { pt, en };

export default function PartnersPage() {
  const params = useParams();
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[locale]?.PartnersPage || dictionaries.pt.PartnersPage;

  const featureIcons = [LayoutDashboard, Users, Package, Palette];
  const featureKeys = ["dashboard", "team", "fullProduct", "branding"] as const;

  return (
    <div className="min-h-screen bg-cream font-sans">

      {/* HERO */}
      <div className="pt-32 pb-20 px-6 bg-[#1a1210] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-gold-soft mb-6"
          >
            {dict.hero.tag}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif mb-6 leading-tight"
          >
            {dict.hero.title}
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
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 bg-gold-soft text-[#1a1210] px-8 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg"
            >
              {dict.hero.ctaPrimary} <ArrowRight size={14} />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              {dict.hero.ctaSecondary}
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">

        {/* DOIS MODELOS */}
        <div className="pt-24 pb-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-[#722F37] mb-3">{dict.modelsTitle}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">{dict.modelsSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 py-16">
          {(["domain", "light"] as const).map((key, i) => {
            const m = dict.models[key];
            const Icon = key === "domain" ? Globe : Sparkles;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-lg"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#722F37]/5 border border-gold-soft/60 flex items-center justify-center text-[#722F37] mb-6">
                  <Icon size={26} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-soft mb-2">{m.subtitle}</p>
                <h3 className="font-serif text-2xl text-gray-800 mb-4">{m.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-8">{m.desc}</p>
                <div className="space-y-3">
                  {m.features.map((f: string) => (
                    <div key={f} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#722F37]/10 text-[#722F37] flex items-center justify-center">
                        <Check size={10} strokeWidth={4} />
                      </div>
                      <span className="text-sm text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* O QUE GANHA */}
        <div className="pt-16 pb-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-[#722F37] mb-3">{dict.featuresTitle}</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 py-16">
          {featureKeys.map((key, i) => {
            const f = dict.features[key];
            const Icon = featureIcons[i];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-cream border border-gold-soft/60 flex items-center justify-center text-[#722F37] mb-5">
                  <Icon size={20} />
                </div>
                <h4 className="font-serif text-lg text-gray-800 mb-2">{f.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* PARA QUEM É */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 md:p-14 my-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#722F37]/5 border border-gold-soft/60 flex items-center justify-center text-[#722F37] shrink-0">
              <Building2 size={22} />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-gray-800">{dict.audienceTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {dict.audience.map((a: string) => (
              <div key={a} className="flex items-start gap-3 bg-cream rounded-2xl p-6">
                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#722F37]/10 text-[#722F37] flex items-center justify-center">
                  <Check size={10} strokeWidth={4} />
                </div>
                <span className="text-sm text-gray-600 leading-relaxed">{a}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CONDIÇÕES COMERCIAIS */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center py-20"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-[#722F37] mb-4">{dict.pricingTitle}</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">{dict.pricingDesc}</p>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 bg-[#722F37] text-white px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-lg hover:bg-[#5a252b] transition-all"
          >
            {dict.finalCta} <ArrowRight size={14} />
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
