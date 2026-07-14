"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  Sparkles, 
  ClipboardCheck, 
  Map, 
  QrCode, 
  Camera, 
  BookHeart, 
  FileText,
  ArrowRight
} from "lucide-react";

// 1. IMPORTAR OS DICIONÁRIOS (3 níveis para trás)
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

export default function FeaturesPage() {
  const params = useParams();
  
  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.DetailedFeaturesPage || dictionaries.pt.DetailedFeaturesPage;

  // A sua lista de funcionalidades original foi TOTALMENTE MANTIDA e agora está ligada ao dicionário dinâmico
  const features = [
    {
      id: "website",
      title: dict.features.website.title,
      description: dict.features.website.desc,
      icon: <Sparkles className="w-6 h-6 text-[#722F37]" />,
      imagePlaceholder: dict.features.website.placeholder,
      reversed: false,
      link: `/${locale}/features/convites-digitais`
    },
    {
      id: "rsvp",
      title: dict.features.rsvp.title,
      description: dict.features.rsvp.desc,
      icon: <ClipboardCheck className="w-6 h-6 text-[#722F37]" />,
      imagePlaceholder: dict.features.rsvp.placeholder,
      reversed: true,
      link: `/${locale}/features/gestao-rsvp`
    },
    {
      id: "seating",
      title: dict.features.seating.title,
      description: dict.features.seating.desc,
      icon: <Map className="w-6 h-6 text-[#722F37]" />,
      imagePlaceholder: dict.features.seating.placeholder,
      reversed: false,
      link: `/${locale}/features/seating-plan`
    },
    {
      id: "qrcode",
      title: dict.features.qrcode.title,
      description: dict.features.qrcode.desc,
      icon: <QrCode className="w-6 h-6 text-[#722F37]" />,
      imagePlaceholder: dict.features.qrcode.placeholder,
      reversed: true,
      link: `/${locale}/features/experiencia-qrcode`
    },
    {
      id: "photosharing",
      title: dict.features.photosharing.title,
      description: dict.features.photosharing.desc,
      icon: <Camera className="w-6 h-6 text-[#722F37]" />,
      imagePlaceholder: dict.features.photosharing.placeholder,
      reversed: false,
      link: `/${locale}/features/photo-sharing`
    },
    {
      id: "guestbook",
      title: dict.features.guestbook.title,
      description: dict.features.guestbook.desc,
      icon: <BookHeart className="w-6 h-6 text-[#722F37]" />,
      imagePlaceholder: dict.features.guestbook.placeholder,
      reversed: true,
      link: `/${locale}/features/livro-honras`
    },
    {
      id: "reports",
      title: dict.features.reports.title,
      description: dict.features.reports.desc,
      icon: <FileText className="w-6 h-6 text-[#722F37]" />,
      imagePlaceholder: dict.features.reports.placeholder,
      reversed: false,
      link: `/${locale}/features/exportacoes-staff`
    }
  ];

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
          {dict.hero.title1} <br className="hidden md:block"/> o seu <span className="text-[#722F37] italic">{dict.hero.title2}</span>
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
        {features.map((feature, index) => (
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
              <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
                {feature.title}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {feature.description}
              </p>
              
              {/* Link Preparado para o Futuro */}
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

            {/* Imagem / Mockup Placeholder */}
            <div className="flex-1 w-full">
              <div className="relative aspect-[4/3] rounded-[2.5rem] bg-gradient-to-tr from-gray-100 to-white border-2 border-gray-50 shadow-2xl overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-[#722F37]/5 group-hover:bg-[#722F37]/10 transition-colors duration-500"></div>
                <p className="text-gray-400 font-medium text-sm text-center px-8 border-2 border-dashed border-gray-300 py-12 rounded-xl">
                  {dict.mockupPrefix} <br/> <strong className="text-gray-600">{feature.imagePlaceholder}</strong> ]
                </p>
              </div>
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