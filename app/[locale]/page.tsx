"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  Smartphone,
  RefreshCw,
  ClipboardCheck,
  CreditCard,
  Mail,
  Timer,
  MapPin,
  Shirt,
  Gift,
  CheckCircle2,
  Users,
  Lock,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';

import pt from '../../dictionaries/pt';
import en from '../../dictionaries/en';
import { Eyebrow } from '../../components/site/Eyebrow';
import { INVITE_TEMPLATES, COMING_SOON_SLOTS } from '../../lib/templates';
const dictionaries = { pt, en };

// Página inicial: o convite digital é o produto principal; os outros módulos
// aparecem como "a viagem" à volta dele (secção journey). A montra de modelos
// lê lib/templates.ts — um modelo novo entra aqui sozinho, e os lugares
// "Em breve" (COMING_SOON_SLOTS) vão desaparecendo.

const FEATURE_SLUG_BY_STEP = ['save-the-date', 'convite-de-casamento', 'convidados-e-mesas', 'photo-sharing-e-live-wall', 'guestbook'];
const JOURNEY_IMAGES = [
  '/features/save-the-date/04-recebido.jpg',
  '/features/convidados-e-mesas/03-rsvp-sincroniza-pt.jpg',
  '/features/convidados-e-mesas/00-concept.jpg',
  '/features/photo-sharing-e-live-wall/04-live-wall-pt.jpg',
  '/features/guestbook/04-casal-em-casa.jpg',
];
const FACT_ICONS = [Smartphone, RefreshCw, ClipboardCheck, CreditCard];
const INSIDE_ICONS = [Mail, Timer, MapPin, Shirt, Gift, CheckCircle2, Users, Lock];

// Telemóvel com o convite a deslizar sozinho (captura completa do Renaissance
// Blue, public/home/rb-scroll.webp, 440×7418). Com "reduzir movimento" fica parado.
const SCROLL_W = 260;
const SCROLL_VIEW_H = 540;
const SCROLL_IMG_H = Math.round(SCROLL_W * 7418 / 440);

function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2.4rem] border-[7px] border-ink bg-ink shadow-2xl overflow-hidden ${className}`}>
      <div className="rounded-[1.9rem] overflow-hidden bg-cream">{children}</div>
    </div>
  );
}

export default function HomePage() {
  const params = useParams();
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[locale]?.HomePage || dictionaries.pt.HomePage;
  const reduceMotion = useReducedMotion();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const featured = INVITE_TEMPLATES[0];
  const newInviteHref = `/${locale}/dashboard/new-invite`;
  const livePreviewHref = `/${locale}/preview/${featured.id}`;

  return (
    <div className="bg-cream text-ink selection:bg-brand selection:text-gold-soft overflow-hidden">

      {/* ── 1. HERO: o convite ───────────────────────────────────────── */}
      <section className="relative pt-36 md:pt-40 pb-20 px-6 md:px-20 min-h-[92vh] flex flex-col justify-center max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full lg:w-[55%] space-y-8 z-10 text-center lg:text-left"
          >
            <Eyebrow align="left">{dict.hero.tag}</Eyebrow>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.08] text-ink tracking-tight">
              {dict.hero.title1} <br className="hidden md:block" />
              <span className="italic text-brand">{dict.hero.title2}</span>
            </h1>

            <p className="text-ink text-lg leading-relaxed opacity-75 max-w-xl mx-auto lg:mx-0">
              {dict.hero.desc}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start pt-2">
              <Link
                href={newInviteHref}
                className="w-full sm:w-auto text-center bg-brand text-gold-soft border-2 border-brand px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full shadow-xl hover:bg-transparent hover:text-brand transition-all duration-500"
              >
                {dict.hero.btnPrimary}
              </Link>
              <Link
                href={livePreviewHref}
                className="group w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-ink hover:text-brand transition-colors"
              >
                {dict.hero.btnSecondary}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {(dict.hero.microcopy as string[]).map((m, i) => (
                <li key={i} className="flex items-center gap-1.5"><Check size={12} className="text-gold" /> {m}</li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="w-full lg:w-[45%] relative flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="relative w-[300px] md:w-[380px] h-[520px] md:h-[600px]">
              <div className="absolute inset-x-6 inset-y-10 bg-gold-soft/60 rounded-[3rem] rotate-[-5deg]" />
              {/* Atrás: o convite já aberto */}
              <PhoneFrame className="absolute top-8 right-0 md:-right-4 w-[180px] md:w-[210px] rotate-[7deg] opacity-95">
                <img src="/home/rb-open.jpg" alt="" className="w-full h-auto block" />
              </PhoneFrame>
              {/* À frente: o envelope, como o convidado o recebe */}
              <PhoneFrame className="absolute bottom-6 left-0 md:left-2 w-[210px] md:w-[250px] rotate-[-3deg]">
                <img src={featured.phone} alt={featured.name} className="w-full h-auto block" />
              </PhoneFrame>
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-0 right-0 md:-right-8 bg-white px-5 py-4 rounded-3xl shadow-2xl border border-gray-50 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{dict.hero.floatingBadge}</p>
                  <p className="font-serif text-base text-ink">{dict.hero.floatingText}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. FACTOS ────────────────────────────────────────────────── */}
      <section className="border-y border-gold-soft/60 bg-white py-10 px-6 md:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {(dict.facts as { title: string; desc: string }[]).map((f, i) => {
            const Icon = FACT_ICONS[i] ?? Sparkles;
            return (
              <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-cream border border-gold-soft/60 text-brand flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-serif text-lg text-ink leading-tight">{f.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. A COLEÇÃO ─────────────────────────────────────────────── */}
      <section id="modelos" className="py-28 px-6 md:px-20 bg-ink text-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-5">
            <Eyebrow tone="gold">{dict.collection.tag}</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl text-gold-soft leading-tight">
              {dict.collection.title1} <span className="italic text-gold">{dict.collection.title2}</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">{dict.collection.desc}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INVITE_TEMPLATES.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-cream/5 border border-gold/40 rounded-[2rem] overflow-hidden flex flex-col"
              >
                <div className="relative h-80 overflow-hidden flex items-start justify-center pt-8 bg-gradient-to-b from-white/[0.04] to-transparent">
                  <div className="relative z-10 w-40 rounded-[1.6rem] shadow-2xl border-[5px] border-white/15 overflow-hidden bg-ink transition-transform duration-500 group-hover:-translate-y-2">
                    <img src={tpl.phone} alt={tpl.name} className="w-full h-auto block" loading="lazy" />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-ink to-transparent z-20 pointer-events-none" />
                </div>
                <div className="p-6 space-y-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-white text-sm uppercase tracking-widest">{tpl.name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed flex-1">{tpl.desc[locale]}</p>
                  <div className="flex flex-col gap-3 pt-2">
                    <Link
                      href={`/${locale}/preview/${tpl.id}`}
                      className="text-center text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-full border border-gold-soft/30 text-gold-soft/80 hover:border-gold-soft/60 hover:text-gold-soft transition-colors"
                    >
                      {dict.collection.previewBtn}
                    </Link>
                    <Link
                      href={newInviteHref}
                      className="text-center text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-full bg-gold text-ink hover:bg-[#C9A96E] transition-colors"
                    >
                      {dict.collection.useBtn}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Lugares dos próximos modelos (COMING_SOON_SLOTS em lib/templates.ts) */}
            {Array.from({ length: COMING_SOON_SLOTS }).map((_, i) => (
              <motion.div
                key={`soon-${i}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (INVITE_TEMPLATES.length + i) * 0.08 }}
                aria-hidden
                className="hidden sm:flex rounded-[2rem] border border-dashed border-gold-soft/20 bg-white/[0.02] min-h-[300px] flex-col items-center justify-center gap-4 text-center p-6"
              >
                <div className="w-14 h-14 rounded-full border border-gold-soft/25 flex items-center justify-center text-gold/70">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="font-serif text-xl text-gold-soft/70 italic">{dict.collection.soonTitle}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-2">{dict.collection.soonDesc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* No telemóvel, os lugares "Em breve" juntam-se numa só linha */}
          {COMING_SOON_SLOTS > 0 && (
            <p className="sm:hidden mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center justify-center gap-2">
              <Sparkles size={12} className="text-gold/70" /> {dict.collection.soonTitle} · {dict.collection.soonDesc}
            </p>
          )}

          <div className="text-center mt-12">
            <a href="#a-medida" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-soft hover:text-white transition-colors border-b border-gold-soft/40 pb-1">
              {dict.collection.bespokeLink} <ArrowDown size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── 4. DENTRO DO CONVITE ─────────────────────────────────────── */}
      <section className="bg-white py-28 px-6 md:px-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          <div className="w-full lg:w-[40%] flex justify-center">
            <div className="relative">
              <div className="absolute -inset-6 bg-cream rounded-[3rem] rotate-[3deg]" />
              <PhoneFrame className="relative">
                <div style={{ width: SCROLL_W, height: SCROLL_VIEW_H }} className="overflow-hidden">
                  <motion.img
                    src="/home/rb-scroll.webp"
                    alt=""
                    loading="lazy"
                    style={{ width: SCROLL_W, height: SCROLL_IMG_H }}
                    className="block max-w-none"
                    animate={reduceMotion ? undefined : { y: [0, 0, -(SCROLL_IMG_H - SCROLL_VIEW_H)] }}
                    transition={{ duration: 48, times: [0, 0.06, 1], repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                  />
                </div>
              </PhoneFrame>
            </div>
          </div>

          <div className="w-full lg:w-[60%] space-y-8">
            <div className="space-y-5 text-center lg:text-left">
              <Eyebrow align="left">{dict.inside.tag}</Eyebrow>
              <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
                {dict.inside.title1} <br className="hidden md:block" /><span className="italic text-brand">{dict.inside.title2}</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">{dict.inside.desc}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {(dict.inside.items as { title: string; desc: string }[]).map((item, i) => {
                const Icon = INSIDE_ICONS[i] ?? Sparkles;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-cream border border-gold-soft/50 text-brand flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink text-sm">{item.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. RSVP E PAINEL ─────────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
          <div className="w-full lg:w-[42%] space-y-7 text-center lg:text-left">
            <Eyebrow align="left">{dict.rsvp.tag}</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
              {dict.rsvp.title1} <span className="italic text-brand">{dict.rsvp.title2}</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">{dict.rsvp.desc}</p>
            <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
              {(dict.rsvp.bullets as string[]).map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink">
                  <span className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-px"><Check size={13} /></span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="w-full lg:w-[58%]"
          >
            <div className="rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>
              <img
                src={`/features/convidados-e-mesas/01-dashboard-${locale}.jpg`}
                alt=""
                loading="lazy"
                className="w-full h-auto block"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 6. A VIAGEM: os outros módulos à volta do convite ────────── */}
      <section className="bg-white py-28 px-6 md:px-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-5">
            <Eyebrow>{dict.journey.tag}</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
              {dict.journey.title1} <br className="hidden md:block" /><span className="italic text-brand">{dict.journey.title2}</span>
            </h2>
            <p className="text-gray-500 text-lg">{dict.journey.desc}</p>
          </div>

          <div className="relative flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-6">
            <div className="hidden lg:block absolute top-[7.5rem] left-[10%] right-[10%] h-px bg-gold-soft" />
            {(dict.journey.steps as { when: string; title: string; desc: string }[]).map((s, i) => {
              const isCore = i === 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="snap-start shrink-0 w-[75%] sm:w-auto"
                >
                  <Link
                    href={`/${locale}/features/${FEATURE_SLUG_BY_STEP[i]}`}
                    className={`group relative h-full flex flex-col rounded-[1.8rem] overflow-hidden border transition-all duration-500 hover:shadow-xl ${
                      isCore ? 'border-brand bg-brand text-white shadow-xl' : 'border-gray-100 bg-cream hover:border-gold-soft'
                    }`}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={JOURNEY_IMAGES[i]} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-5 space-y-2 flex-1">
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${isCore ? 'text-gold-soft' : 'text-gold'}`}>{s.when}</p>
                      <h3 className={`font-serif text-xl ${isCore ? 'text-white' : 'text-ink'}`}>{s.title}</h3>
                      <p className={`text-xs leading-relaxed ${isCore ? 'text-white/75' : 'text-gray-500'}`}>{s.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href={`/${locale}/features`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand hover:text-black transition-colors border-b-2 border-brand pb-1">
              {dict.journey.link} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. CONVITE À MEDIDA ──────────────────────────────────────── */}
      <section id="a-medida" className="py-28 px-6 md:px-20 bg-gold-soft/20 scroll-mt-20">
        <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-14 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="w-full lg:w-1/2 flex justify-center"
          >
            {/* Colagem com os elementos do Renaissance Blue — o modelo nasceu à medida */}
            <div className="relative w-[320px] h-[380px] md:w-[420px] md:h-[460px]">
              <div className="absolute inset-6 rounded-[2.5rem] bg-[url('/home/bespoke-toile.webp')] bg-cover opacity-60 border border-white shadow-xl" />
              <img src="/home/bespoke-busto.webp" alt="" loading="lazy" className="absolute left-0 bottom-10 w-28 md:w-36 drop-shadow-xl" />
              <img src="/home/bespoke-calla.webp" alt="" loading="lazy" className="absolute right-0 -top-2 w-28 md:w-36 drop-shadow-xl" />
              <img src="/home/bespoke-envelope.webp" alt="" loading="lazy" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 md:w-72 drop-shadow-2xl rotate-[-4deg]" />
              <img src="/home/bespoke-hortensias.webp" alt="" loading="lazy" className="absolute right-2 bottom-0 w-36 md:w-44 drop-shadow-xl" />
            </div>
          </motion.div>

          <div className="w-full lg:w-1/2 space-y-7 text-center lg:text-left">
            <Eyebrow align="left">{dict.bespoke.tag}</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
              {dict.bespoke.title1} <br className="hidden md:block" /><span className="italic text-brand">{dict.bespoke.title2}</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">{dict.bespoke.desc}</p>
            <ul className="grid sm:grid-cols-2 gap-3 text-left">
              {(dict.bespoke.points as string[]).map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink bg-white/70 rounded-2xl px-4 py-3 border border-gold-soft/50">
                  <Sparkles size={14} className="text-gold shrink-0 mt-0.5" /> {p}
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link
                href={`/${locale}/contact?assunto=medida`}
                className="inline-flex items-center gap-3 bg-brand text-gold-soft px-9 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full shadow-xl hover:bg-brand-dark transition-colors"
              >
                {dict.bespoke.cta} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. COMO FUNCIONA ─────────────────────────────────────────── */}
      <section className="bg-ink py-28 px-6 md:px-20 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl text-gold-soft italic mb-20">{dict.steps.title}</h2>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gold-soft/20" />
            {(dict.steps.items as { step: string; title: string; desc: string }[]).map((s, i) => (
              <div key={i} className="relative z-10 space-y-6">
                <div className="w-24 h-24 mx-auto bg-ink border border-gold-soft/30 text-gold-soft rounded-full flex items-center justify-center font-serif text-3xl italic shadow-2xl">
                  {s.step}
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">{s.title}</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Link href={`/${locale}/pricing`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-soft hover:text-white transition-colors border-b border-gold-soft/40 pb-1">
              {dict.steps.pricingLink} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. PARCEIROS (faixa discreta) ────────────────────────────── */}
      <section className="bg-brand py-14 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="space-y-3 max-w-2xl">
            <Eyebrow tone="gold" align="left">{dict.b2b.tag}</Eyebrow>
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-tight">{dict.b2b.title}</h2>
            <p className="text-white/70 leading-relaxed">{dict.b2b.desc}</p>
          </div>
          <Link
            href={`/${locale}/partners`}
            className="shrink-0 inline-flex items-center gap-3 bg-gold-soft text-brand px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-white transition-colors shadow-lg"
          >
            {dict.b2b.cta} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── 10. FAQ ──────────────────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-20 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 space-y-4">
            <h2 className="font-serif text-4xl md:text-5xl text-ink">{dict.faq.title}</h2>
            <p className="text-gray-500 text-lg">{dict.faq.subtitle}</p>
          </div>

          <div className="space-y-3">
            {(dict.faq.items as { q: string; a: string }[]).map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between px-7 py-5 text-left bg-white hover:bg-cream transition-colors"
                >
                  <span className="font-semibold text-ink text-sm pr-6">{item.q}</span>
                  <ChevronDown size={18} className={`text-brand shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
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
                      <p className="px-7 pb-6 pt-1 text-sm text-gray-500 leading-relaxed border-t border-gray-100">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. CTA FINAL ────────────────────────────────────────────── */}
      <section className="bg-gold-soft/20 pt-28 pb-36 px-6 md:px-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-8 bg-white p-10 md:p-20 rounded-[3rem] shadow-2xl border border-white"
        >
          <div className="w-16 h-1 bg-brand mx-auto opacity-50" />
          <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
            {dict.cta.title1} <br className="hidden md:block" /><span className="italic text-brand">{dict.cta.title2}</span>
          </h2>
          <p className="text-gray-600 text-lg">{dict.cta.desc}</p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href={newInviteHref}
              className="w-full sm:w-auto bg-brand text-gold-soft px-12 py-5 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-brand-dark shadow-xl transition-all duration-500"
            >
              {dict.cta.btnPrimary}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-bold text-ink hover:text-brand transition-colors"
            >
              {dict.cta.btnSecondary} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
