"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Smartphone, CalendarHeart, Mail, Users, Camera, MessageSquareHeart, ArrowRight, Check
} from "lucide-react";
import { ALL_MODULE_IDS, type ModuleId } from "@/lib/modules";
import { FEATURE_SLUGS } from "./slugs";

// 1. IMPORTAR OS DICIONÁRIOS (3 níveis para trás)
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

const MODULE_ICONS: Record<ModuleId, React.ReactNode> = {
  save_the_date: <CalendarHeart className="w-6 h-6 text-[#722F37]" />,
  invite: <Mail className="w-6 h-6 text-[#722F37]" />,
  guests_seating: <Users className="w-6 h-6 text-[#722F37]" />,
  photo_sharing: <Camera className="w-6 h-6 text-[#722F37]" />,
  guestbook: <MessageSquareHeart className="w-6 h-6 text-[#722F37]" />,
};

const MODULE_VISUAL_ICONS: Record<ModuleId, React.ReactNode> = {
  save_the_date: <CalendarHeart className="w-16 h-16" />,
  invite: <Mail className="w-16 h-16" />,
  guests_seating: <Users className="w-16 h-16" />,
  photo_sharing: <Camera className="w-16 h-16" />,
  guestbook: <MessageSquareHeart className="w-16 h-16" />,
};

// Módulos com uma foto real que já explica o conceito à primeira vista,
// em vez do painel genérico ícone+chips.
const MODULE_CONCEPT_IMAGES: Partial<Record<ModuleId, string>> = {
  photo_sharing: "/features/photo-sharing-e-live-wall/00-concept.jpg",
};

export default function FeaturesPage() {
  const params = useParams();
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[locale]?.DetailedFeaturesPage || dictionaries.pt.DetailedFeaturesPage;
  const detailDict = dictionaries[locale]?.FeatureDetailPage || dictionaries.pt.FeatureDetailPage;
  const moduleNames = dictionaries[locale]?.ModuleNames || dictionaries.pt.ModuleNames;

  const features = ALL_MODULE_IDS.map((id, index) => {
    const m = (detailDict.modules as Record<string, { tag: string; title: string; summary: string; includes: string[] }>)[id];
    return {
      id,
      tag: m.tag,
      title: (moduleNames as Record<string, string>)[id],
      headline: m.title,
      description: m.summary,
      chips: m.includes.slice(0, 3),
      icon: MODULE_ICONS[id],
      visualIcon: MODULE_VISUAL_ICONS[id],
      conceptImage: MODULE_CONCEPT_IMAGES[id],
      reversed: index % 2 === 1,
      link: `/${locale}/features/${FEATURE_SLUGS[id]}`
    };
  });

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 font-sans overflow-hidden">

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 text-center mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest text-[#722F37] mb-6 shadow-sm"
        >
          <Smartphone size={14} />
          <span>{dict.hero.badge}</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-serif text-gray-900 mb-6 leading-tight"
        >
          {dict.hero.title1} <br className="hidden md:block"/> <span className="text-[#722F37] italic">{dict.hero.title2}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed"
        >
          {dict.hero.desc}
        </motion.p>
      </div>

      {/* Funcionalidades (Zig-Zag Layout) */}
      <div className="max-w-7xl mx-auto px-6 space-y-32">
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className={`flex flex-col gap-12 lg:gap-24 items-center ${
              feature.reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
            }`}
          >
            {/* Texto */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto lg:mx-0">
                {feature.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-soft mb-3">{feature.tag}</p>
                <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
                  {feature.title}
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              <div className="pt-2">
                <Link
                  href={feature.link}
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#722F37] hover:text-black transition-colors group"
                >
                  {dict.discoverMore}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Painel visual */}
            <div className="flex-1 w-full">
              {feature.conceptImage ? (
                <div className="relative aspect-[4/3] rounded-[2.5rem] border-2 border-white shadow-2xl overflow-hidden">
                  <img src={feature.conceptImage} alt={feature.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="relative aspect-[4/3] rounded-[2.5rem] bg-gradient-to-tr from-[#722F37]/10 via-cream to-white border-2 border-white shadow-2xl overflow-hidden flex flex-col items-center justify-center gap-6 p-8">
                  <div className="text-[#722F37]/25">
                    {feature.visualIcon}
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    {feature.chips.map((chip) => (
                      <div key={chip} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                        <div className="w-4 h-4 rounded-full bg-[#722F37]/10 text-[#722F37] flex items-center justify-center shrink-0">
                          <Check size={9} strokeWidth={4} />
                        </div>
                        <span className="text-[11px] text-gray-600 font-medium truncate">{chip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to Action Final */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto mt-40 text-center px-6"
      >
        <h2 className="text-3xl font-serif text-[#722F37] mb-6">{dict.cta.title}</h2>
        <Link
          href={`/${locale}/pricing`}
          className="inline-flex h-14 items-center justify-center px-8 rounded-full bg-[#722F37] text-white text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-[#5a252b] hover:scale-105 transition-all"
        >
          {dict.cta.btn}
        </Link>
      </motion.div>

    </div>
  );
}
