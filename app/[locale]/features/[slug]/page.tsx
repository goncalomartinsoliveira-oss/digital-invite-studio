"use client";
import React from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, CalendarHeart, Mail, Users, Camera, MessageSquareHeart
} from "lucide-react";
import { ALL_MODULE_IDS, type ModuleId } from "@/lib/modules";
import { FEATURE_SLUGS, moduleIdFromSlug } from "../slugs";

// 1. IMPORTAR OS DICIONÁRIOS (4 níveis para trás)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

const MODULE_ICONS: Record<ModuleId, React.ReactNode> = {
  save_the_date: <CalendarHeart size={26} />,
  invite: <Mail size={26} />,
  guests_seating: <Users size={26} />,
  photo_sharing: <Camera size={26} />,
  guestbook: <MessageSquareHeart size={26} />,
};

export default function FeatureDetailPage() {
  const params = useParams();
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  const slug = params?.slug as string;
  const dict = dictionaries[locale]?.FeatureDetailPage || dictionaries.pt.FeatureDetailPage;
  const moduleNames = dictionaries[locale]?.ModuleNames || dictionaries.pt.ModuleNames;

  const moduleId = moduleIdFromSlug(slug);
  if (!moduleId) return notFound();

  const m = (dict.modules as Record<string, {
    tag: string; title: string; summary: string; desc: string;
    includes: string[]; examples: { title: string; desc: string }[];
  }>)[moduleId];

  const otherModules = ALL_MODULE_IDS.filter(id => id !== moduleId);

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-6">

        <Link
          href={`/${locale}/features`}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#722F37] transition-colors mb-10"
        >
          <ArrowLeft size={14} /> {dict.backLink}
        </Link>

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-[#722F37] mb-6">
            {MODULE_ICONS[moduleId]}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-soft mb-4">{m.tag}</p>
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6 leading-tight max-w-3xl">
            {m.title}
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
            {m.desc}
          </p>
        </motion.div>

        {/* O QUE INCLUI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-[#722F37] mb-8">{dict.includesTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {m.includes.map((item) => (
              <div key={item} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#722F37]/10 text-[#722F37] flex items-center justify-center">
                  <Check size={11} strokeWidth={4} />
                </div>
                <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NA PRÁTICA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-[#722F37] mb-8">{dict.examplesTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {m.examples.map((ex, i) => (
              <div key={ex.title} className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#722F37] text-white font-serif text-sm mb-5">
                  {i + 1}
                </span>
                <h4 className="font-serif text-lg text-gray-800 mb-2">{ex.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{ex.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* OUTRAS FUNCIONALIDADES */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 text-center">{dict.otherFeaturesTitle}</h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {otherModules.map(id => (
              <Link
                key={id}
                href={`/${locale}/features/${FEATURE_SLUGS[id]}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:border-[#722F37] hover:text-[#722F37] transition-all"
              >
                {(moduleNames as Record<string, string>)[id]}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* CTA FINAL */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-serif text-[#722F37] mb-8">{dict.ctaTitle}</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-[#722F37] text-white text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-[#5a252b] hover:scale-105 transition-all"
            >
              {dict.ctaPricing} <ArrowRight size={14} />
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center h-14 px-8 rounded-full border border-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-widest hover:border-[#722F37] hover:text-[#722F37] transition-all"
            >
              {dict.ctaStart}
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
