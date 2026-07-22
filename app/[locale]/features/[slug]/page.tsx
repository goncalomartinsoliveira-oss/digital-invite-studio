"use client";
import React from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, CalendarHeart, Mail, Users, Camera, MessageSquareHeart,
  Image as ImageIcon, Timer, Heart, Images, CalendarClock, MapPin, Info, BedDouble, Shirt, Gift, CheckCircle2, Phone
} from "lucide-react";
import { ALL_MODULE_IDS, type ModuleId } from "@/lib/modules";
import { FEATURE_SLUGS, moduleIdFromSlug } from "../slugs";
import { Eyebrow } from "@/components/site/Eyebrow";

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

// Ícone de cada secção do website de casamento (só usado no módulo "invite",
// no bloco que lista todas as secções que o convite pode ter).
const INVITE_SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <ImageIcon size={18} />,
  countdown: <Timer size={18} />,
  story: <Heart size={18} />,
  gallery: <Images size={18} />,
  program: <CalendarClock size={18} />,
  event: <MapPin size={18} />,
  useful_info: <Info size={18} />,
  accommodation: <BedDouble size={18} />,
  dress_code: <Shirt size={18} />,
  gifts: <Gift size={18} />,
  rsvp: <CheckCircle2 size={18} />,
  footer: <Phone size={18} />,
};

// Imagens do "como funciona": algumas variam por idioma (mostram texto do
// interface, ex.: um print do painel ou de um telemóvel), outras são a
// mesma para PT/EN (ex.: uma foto do QR code numa mesa do evento).
const HOW_IT_WORKS_IMAGES: Partial<Record<ModuleId, { file: string; perLocale: boolean }[]>> = {
  photo_sharing: [
    { file: "01-dashboard", perLocale: true },
    { file: "02-qr-evento", perLocale: false },
    { file: "03-mobile-galeria", perLocale: true },
    { file: "04-live-wall", perLocale: true },
  ],
  guestbook: [
    { file: "01-dashboard", perLocale: true },
    { file: "02-qr-evento", perLocale: false },
    { file: "03-convidado-mensagem", perLocale: false },
    { file: "04-casal-em-casa", perLocale: false },
  ],
  save_the_date: [
    { file: "01-dashboard", perLocale: true },
    { file: "02-cartao-gerado", perLocale: true },
    { file: "03-partilhar", perLocale: false },
    { file: "04-recebido", perLocale: false },
  ],
  invite: [
    { file: "01-dashboard", perLocale: true },
    { file: "02-website", perLocale: true },
    { file: "03-partilhar", perLocale: false },
    { file: "04-rsvp", perLocale: true },
  ],
  guests_seating: [
    { file: "01-dashboard", perLocale: true },
    { file: "02-mesas", perLocale: true },
    { file: "03-rsvp-sincroniza", perLocale: true },
    { file: "04-encontra-mesa", perLocale: true },
  ],
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
    howItWorks?: { tag: string; title: string; steps: { title: string; desc: string }[]; outro?: string };
    sectionsBlock?: {
      tag: string; title: string; intro: string; footnote: string;
      sections: { key: string; name: string; desc: string }[];
    };
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
          <div className="mb-4"><Eyebrow align="left">{m.tag}</Eyebrow></div>
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6 leading-tight max-w-3xl">
            {m.title}
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
            {m.desc}
          </p>
        </motion.div>

        {/* COMO FUNCIONA, PASSO A PASSO (com imagens) */}
        {m.howItWorks && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-3">{m.howItWorks.tag}</p>
            <h2 className="font-serif text-2xl md:text-3xl text-[#722F37] mb-14 max-w-2xl">{m.howItWorks.title}</h2>

            <div className="space-y-16">
              {m.howItWorks.steps.map((step, i) => {
                const img = HOW_IT_WORKS_IMAGES[moduleId]?.[i];
                const src = img ? `/features/${slug}/${img.file}${img.perLocale ? `-${locale}` : ""}.jpg` : null;
                return (
                  <div
                    key={step.title}
                    className={`grid md:grid-cols-2 gap-8 md:gap-14 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
                  >
                    <div className="relative rounded-[2rem] overflow-hidden border border-gray-100 shadow-md aspect-[4/3] bg-cream flex items-center justify-center text-[#722F37]/20">
                      {MODULE_ICONS[moduleId]}
                      {src && (
                        <img
                          src={src}
                          alt={step.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            // Enquanto não houver versão EN de uma imagem, tenta a PT antes de desistir.
                            if (img?.perLocale && locale !== "pt" && !e.currentTarget.src.endsWith("-pt.jpg")) {
                              e.currentTarget.src = `/features/${slug}/${img.file}-pt.jpg`;
                              return;
                            }
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#722F37] text-white font-serif text-sm mb-5">
                        {i + 1}
                      </span>
                      <h3 className="font-serif text-xl md:text-2xl text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {m.howItWorks.outro && (
              <p className="text-gray-500 leading-relaxed mt-14 max-w-2xl mx-auto text-center italic">
                {m.howItWorks.outro}
              </p>
            )}
          </motion.div>
        )}

        {/* TODAS AS SECÇÕES DO SITE (só o módulo do convite) */}
        {m.sectionsBlock && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <div className="mb-3"><Eyebrow align="left">{m.sectionsBlock.tag}</Eyebrow></div>
            <h2 className="font-serif text-2xl md:text-3xl text-[#722F37] mb-4 max-w-2xl">{m.sectionsBlock.title}</h2>
            <p className="text-gray-500 leading-relaxed max-w-2xl mb-12">{m.sectionsBlock.intro}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {m.sectionsBlock.sections.map((sec) => (
                <div key={sec.key} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl bg-[#722F37]/5 border border-gold-soft/50 text-[#722F37] flex items-center justify-center">
                    {INVITE_SECTION_ICONS[sec.key] ?? <Check size={16} />}
                  </div>
                  <div>
                    <h4 className="font-serif text-lg text-gray-800 leading-tight mb-1">{sec.name}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{sec.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 mt-8 bg-cream rounded-2xl px-6 py-5 border border-gold-soft/60 max-w-3xl">
              <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#722F37]/10 text-[#722F37] flex items-center justify-center">
                <Check size={11} strokeWidth={4} />
              </div>
              <p className="text-sm text-ink/80 leading-relaxed">{m.sectionsBlock.footnote}</p>
            </div>
          </motion.div>
        )}

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
