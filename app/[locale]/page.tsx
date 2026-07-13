"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  Smartphone,
  Clock,
  Leaf,
  ClipboardCheck,
  Map,
  Camera,
  ArrowRight,
  CheckCircle2,
  Quote,
  ChevronDown,
  LayoutGrid,
  Users,
  Zap,
  HeadphonesIcon
} from 'lucide-react';

import pt from '../../dictionaries/pt';
import en from '../../dictionaries/en';
const dictionaries = { pt, en };

export default function HomePage() {
  const params = useParams();
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[locale]?.HomePage || dictionaries.pt.HomePage;

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-[#FDFBF7] text-[#332E2B] selection:bg-[#630100] selection:text-[#EFDFBB] overflow-hidden">

      {/* ── 1. HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-20 px-6 md:px-20 min-h-[95vh] flex flex-col justify-center max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 space-y-10 z-10 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFDFBB]/30 border border-[#EFDFBB] text-[10px] font-bold uppercase tracking-widest text-[#630100] shadow-sm mx-auto lg:mx-0">
              <Sparkles size={14} />
              <span>{dict.hero.tag}</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-[#332E2B] tracking-tight">
              {dict.hero.title1} <br className="hidden md:block"/>
              <span className="italic text-[#630100]">{dict.hero.title2}</span>
            </h1>

            <p className="text-[#332E2B] text-lg leading-relaxed opacity-75 font-normal max-w-lg mx-auto lg:mx-0">
              {dict.hero.desc}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start pt-4">
              <Link href={`/${locale}/pricing`}>
                <button className="w-full sm:w-auto bg-[#630100] text-[#EFDFBB] border-2 border-[#630100] px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full shadow-xl hover:bg-transparent hover:text-[#630100] transition-all duration-500 transform hover:-translate-y-1">
                  {dict.hero.btn1}
                </button>
              </Link>
              <Link href={`/${locale}/features`}>
                <button className="group flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-bold text-[#332E2B] hover:text-[#630100] transition-colors">
                  {dict.hero.btn2}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="w-full lg:w-1/2 relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="relative w-[300px] md:w-[400px] h-[450px] md:h-[550px]">
              <div className="absolute inset-0 bg-[#EFDFBB] rounded-[2.5rem] rotate-[-4deg] scale-105 opacity-50"></div>
              <div className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex items-center justify-center p-2">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center rounded-[1.5rem] opacity-90 grayscale-[10%]"></div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 -left-8 md:-left-16 bg-white p-6 rounded-3xl shadow-2xl border border-gray-50 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{dict.hero.floatingBadge}</p>
                  <p className="font-serif text-lg text-[#332E2B]">{dict.hero.floatingText}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. STATS BAR ─────────────────────────────────────────────── */}
      <section className="border-y border-[#EFDFBB]/60 bg-white py-10 px-6 md:px-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {(dict.stats.items as any[]).map((item: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="font-serif text-4xl md:text-5xl text-[#630100] italic">{item.value}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. TEMPLATE SHOWCASE ─────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-20 bg-[#332E2B] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFDFBB]/10 border border-[#EFDFBB]/20 text-[10px] font-bold uppercase tracking-widest text-[#EFDFBB]">
              <Sparkles size={12} />
              <span>{dict.templateShowcase.tag}</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-[#EFDFBB] leading-tight">
              {dict.templateShowcase.title1} <span className="italic text-[#B8945A]">{dict.templateShowcase.title2}</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">{dict.templateShowcase.desc}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(dict.templateShowcase.templates as any[]).map((tpl: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="group relative bg-[#FDFBF7]/5 border border-[#EFDFBB]/10 rounded-[2rem] overflow-hidden hover:border-[#B8945A]/40 transition-all duration-500"
              >
                {/* Template preview mockup */}
                <div className="relative h-80 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#2D4A3E]/40 to-[#1a2f27]/60">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=60')] bg-cover bg-center"></div>
                  {/* Phone frame */}
                  <div className="relative z-10 w-28 h-52 bg-white rounded-[1.5rem] shadow-2xl border-4 border-white/20 overflow-hidden flex flex-col">
                    <div className="h-2 bg-gray-200 flex items-center justify-center">
                      <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex-1 bg-gradient-to-b from-[#2D4A3E] to-[#1a2f27] flex flex-col items-center justify-center p-2 gap-1">
                      <div className="w-6 h-6 bg-[#B8945A]/40 rounded-full"></div>
                      <div className="w-16 h-1 bg-[#EFDFBB]/40 rounded-full"></div>
                      <div className="w-12 h-1 bg-[#EFDFBB]/20 rounded-full"></div>
                      <div className="w-16 h-1 bg-[#EFDFBB]/20 rounded-full mt-1"></div>
                      <div className="w-10 h-1 bg-[#B8945A]/30 rounded-full mt-2"></div>
                    </div>
                  </div>
                  {i === 0 && (
                    <div className="absolute top-4 right-4 bg-[#B8945A] text-[#332E2B] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Novo
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-white text-sm uppercase tracking-widest">{tpl.name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{tpl.desc}</p>
                  <div className="flex gap-3 pt-2">
                    <Link
                      href={`/${locale}/preview/${tpl.id}`}
                      className="flex-1 text-center text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-full border border-[#EFDFBB]/20 text-[#EFDFBB]/70 hover:border-[#EFDFBB]/50 hover:text-[#EFDFBB] transition-colors"
                    >
                      {dict.templateShowcase.previewBtn}
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/new-invite`}
                      className="flex-1 text-center text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-full bg-[#B8945A] text-[#332E2B] hover:bg-[#C9A96E] transition-colors"
                    >
                      {dict.templateShowcase.useBtn}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PRODUTO CORE ──────────────────────────────────────────── */}
      <section className="bg-white py-32 px-6 md:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full lg:w-1/2 relative"
          >
            {/* Visual: stacked phone mockups */}
            <div className="relative flex items-center justify-center h-[500px]">
              <div className="absolute w-52 h-96 bg-[#2D4A3E] rounded-[2rem] shadow-2xl rotate-[-8deg] translate-x-[-60px] border-4 border-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-b from-[#2D4A3E] to-[#1a2f27] flex flex-col items-center pt-10 gap-3 p-4">
                  <div className="w-16 h-16 bg-[#B8945A]/20 rounded-full"></div>
                  <div className="w-24 h-1.5 bg-[#EFDFBB]/40 rounded-full"></div>
                  <div className="w-20 h-1 bg-[#EFDFBB]/20 rounded-full"></div>
                  <div className="w-28 h-px bg-[#EFDFBB]/10 rounded-full mt-3"></div>
                  <div className="w-full space-y-2 mt-3">
                    {[1,2,3].map(j => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#B8945A]/20 rounded-full shrink-0"></div>
                        <div className="w-full h-1 bg-[#EFDFBB]/15 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative z-10 w-56 h-[420px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="h-full bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D4A3E]/80 via-transparent to-transparent flex flex-col justify-end p-5">
                  <p className="text-[#EFDFBB] font-serif text-lg italic">Isabella & William</p>
                  <p className="text-[#EFDFBB]/70 text-[10px] uppercase tracking-widest mt-1">12 Set. 2026 · Lisboa</p>
                </div>
              </div>
              <div className="absolute w-44 h-80 bg-[#EFDFBB] rounded-[2rem] shadow-xl rotate-[6deg] translate-x-[60px] border-4 border-white/20 overflow-hidden">
                <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-20 h-20 bg-[#630100]/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-[#630100]/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#332E2B] text-[10px] font-bold uppercase tracking-widest opacity-50">RSVP</p>
                    <p className="font-serif text-[#332E2B] text-sm italic mt-1">186 confirmados</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full lg:w-1/2 space-y-8 text-center lg:text-left"
          >
            <h2 className="font-serif text-4xl md:text-5xl text-[#332E2B] leading-tight">
              {dict.core.title1} <span className="italic text-[#630100]">{dict.core.title2}</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {dict.core.desc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-left">
              {[
                { icon: <Smartphone size={20} className="text-[#630100]"/>, title: dict.core.features[0].title, desc: dict.core.features[0].desc },
                { icon: <Clock size={20} className="text-[#630100]"/>, title: dict.core.features[1].title, desc: dict.core.features[1].desc },
                { icon: <Leaf size={20} className="text-[#630100]"/>, title: dict.core.features[2].title, desc: dict.core.features[2].desc },
                { icon: <Sparkles size={20} className="text-[#630100]"/>, title: dict.core.features[3].title, desc: dict.core.features[3].desc },
              ].map((item, i) => (
                <div key={i} className="bg-[#FDFBF7] p-6 rounded-3xl border border-[#EFDFBB]/30 hover:shadow-md transition-shadow">
                  <div className="mb-3">{item.icon}</div>
                  <h4 className="font-bold text-[#332E2B] text-sm mb-2">{item.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. ECOSSISTEMA ───────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-20 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h2 className="font-serif text-4xl md:text-5xl text-[#332E2B]">{dict.eco.title1} <br/> <span className="italic text-[#630100]">{dict.eco.title2}</span></h2>
          <p className="text-gray-500 text-lg">{dict.eco.desc}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <ClipboardCheck size={32} strokeWidth={1.5} />, title: dict.eco.cards[0].title, desc: dict.eco.cards[0].desc },
            { icon: <Map size={32} strokeWidth={1.5} />, title: dict.eco.cards[1].title, desc: dict.eco.cards[1].desc },
            { icon: <Camera size={32} strokeWidth={1.5} />, title: dict.eco.cards[2].title, desc: dict.eco.cards[2].desc }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#EFDFBB] transition-all duration-500 text-center group"
            >
              <div className="w-20 h-20 mx-auto bg-[#FDFBF7] rounded-full flex items-center justify-center text-[#630100] mb-6 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              <h3 className="font-serif text-2xl text-[#332E2B] mb-4">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href={`/${locale}/features`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#630100] hover:text-black transition-colors border-b-2 border-[#630100] pb-1">
            {dict.eco.link} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── 6. TESTEMUNHOS ───────────────────────────────────────────── */}
      <section className="bg-[#EFDFBB]/20 py-32 px-6 md:px-20 border-y border-[#EFDFBB]/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="font-serif text-4xl md:text-5xl text-[#332E2B]">{dict.testimonials.title}</h2>
            <p className="text-gray-500 text-lg">{dict.testimonials.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {(dict.testimonials.items as any[]).map((item: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-lg transition-shadow flex flex-col gap-6"
              >
                <Quote size={28} className="text-[#630100]/30 shrink-0" />
                <p className="font-serif text-lg italic text-[#332E2B] leading-relaxed flex-1">
                  {item.quote}
                </p>
                <div className="border-t border-gray-100 pt-5">
                  <p className="font-bold text-sm text-[#332E2B]">{item.name}</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-0.5">{item.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. COMO FUNCIONA ─────────────────────────────────────────── */}
      <section className="bg-[#332E2B] py-32 px-6 md:px-20 text-center border-b border-[#630100]/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl text-[#EFDFBB] italic mb-20">{dict.steps.title}</h2>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-[#EFDFBB]/20"></div>

            {(dict.steps.items as any[]).map((s: any, i: number) => (
              <div key={i} className="relative z-10 space-y-6">
                <div className="w-24 h-24 mx-auto bg-[#332E2B] border border-[#EFDFBB]/30 text-[#EFDFBB] rounded-full flex items-center justify-center font-serif text-3xl italic shadow-2xl">
                  {s.step}
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">{s.title}</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. B2B BAND ──────────────────────────────────────────────── */}
      <section className="bg-[#630100] py-20 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 text-center lg:text-left space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-widest text-[#EFDFBB]">
              <Users size={12} />
              <span>{dict.b2b.tag}</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              {dict.b2b.title}
            </h2>
            <p className="text-white/70 text-lg leading-relaxed max-w-xl">
              {dict.b2b.desc}
            </p>
            <Link href={`/${locale}/pricing`}>
              <button className="mt-2 inline-flex items-center gap-3 bg-[#EFDFBB] text-[#630100] px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-white transition-colors shadow-lg">
                {dict.b2b.cta}
                <ArrowRight size={14} />
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 grid grid-cols-2 gap-4"
          >
            {[
              { icon: <LayoutGrid size={20} />, label: dict.b2b.features[0] },
              { icon: <Zap size={20} />, label: dict.b2b.features[1] },
              { icon: <CheckCircle2 size={20} />, label: dict.b2b.features[2] },
              { icon: <HeadphonesIcon size={20} />, label: dict.b2b.features[3] },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-5 py-4">
                <div className="text-[#EFDFBB]/70 shrink-0">{f.icon}</div>
                <span className="text-white text-xs font-semibold leading-snug">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 9. FAQ ───────────────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-20 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif text-4xl md:text-5xl text-[#332E2B]">{dict.faq.title}</h2>
            <p className="text-gray-500 text-lg">{dict.faq.subtitle}</p>
          </div>

          <div className="space-y-3">
            {(dict.faq.items as any[]).map((item: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="border border-gray-200 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-7 py-5 text-left bg-white hover:bg-[#FDFBF7] transition-colors"
                >
                  <span className="font-semibold text-[#332E2B] text-sm pr-6">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#630100] shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-7 pb-6 pt-1 text-sm text-gray-500 leading-relaxed border-t border-gray-100">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. CTA FINAL ────────────────────────────────────────────── */}
      <section className="bg-[#EFDFBB]/20 pt-32 pb-40 px-6 md:px-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-10 bg-white p-12 md:p-20 rounded-[3rem] shadow-2xl border border-white"
        >
          <div className="w-16 h-1 bg-[#630100] mx-auto opacity-50"></div>
          <h2 className="font-serif text-4xl md:text-5xl italic text-[#332E2B]">{dict.cta.title}</h2>
          <p className="text-gray-600 text-lg">{dict.cta.desc}</p>
          <div className="pt-6">
            <Link href={`/${locale}/pricing`}>
               <button className="bg-[#630100] text-[#EFDFBB] px-12 py-5 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-[#4a0100] shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                 {dict.cta.btn}
               </button>
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
