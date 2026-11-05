"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarHeart, Mail, Users, Camera, MessageSquareHeart, ArrowRight, Check, ListChecks, LayoutDashboard, Wallet, Sparkles
} from "lucide-react";
import { type ModuleId } from "@/lib/modules";
import { FEATURE_SLUGS } from "./slugs";
import { FEATURE_IMAGES, featureImageSrc } from "./images";
import { INVITE_TEMPLATES } from "@/lib/templates";
import { Eyebrow } from "@/components/site/Eyebrow";

import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = { pt, en };

// Página de funcionalidades: o convite em destaque (é o produto principal) e
// os outros quatro módulos "à volta do convite", pela ordem em que entram no
// casamento. As imagens vêm da lista fixa em ./images.ts.

const MODULE_ICONS: Record<ModuleId, React.ElementType> = {
  save_the_date: CalendarHeart,
  invite: Mail,
  guests_seating: Users,
  photo_sharing: Camera,
  guestbook: MessageSquareHeart,
};
const AROUND_INVITE: ModuleId[] = ["save_the_date", "guests_seating", "photo_sharing", "guestbook"];
const CONNECTED_ICONS = [ListChecks, LayoutDashboard, Wallet];

type ModuleCopy = { tag: string; title: string; summary: string; includes: string[] };

export default function FeaturesPage() {
  const params = useParams();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = dictionaries[locale]?.DetailedFeaturesPage || dictionaries.pt.DetailedFeaturesPage;
  const detailDict = dictionaries[locale]?.FeatureDetailPage || dictionaries.pt.FeatureDetailPage;
  const moduleNames = (dictionaries[locale]?.ModuleNames || dictionaries.pt.ModuleNames) as Record<string, string>;
  const copy = detailDict.modules as Record<string, ModuleCopy>;

  const invite = copy.invite;
  const inviteImage = featureImageSrc("invite", FEATURE_IMAGES.invite.concept, locale);
  const featured = INVITE_TEMPLATES[0];

  return (
    <div className="min-h-screen bg-cream pt-32 font-sans overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 text-center mb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Eyebrow>{dict.hero.badge}</Eyebrow>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-serif text-ink mb-6 leading-tight"
        >
          {dict.hero.title1} <br className="hidden md:block" /><span className="text-brand italic">{dict.hero.title2}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed"
        >
          {dict.hero.desc}
        </motion.p>

        {/* Atalhos para cada módulo */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          aria-label={dict.jumpLabel}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {(["invite", ...AROUND_INVITE] as ModuleId[]).map(id => {
            const Icon = MODULE_ICONS[id];
            return (
              <a
                key={id}
                href={`#${FEATURE_SLUGS[id]}`}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  id === "invite" ? "bg-brand text-gold-soft border-brand" : "bg-white text-gray-500 border-gray-200 hover:border-brand hover:text-brand"
                }`}
              >
                <Icon size={13} /> {moduleNames[id]}
              </a>
            );
          })}
        </motion.nav>
      </section>

      {/* ── O CONVITE (destaque) ─────────────────────────────────────── */}
      <section id={FEATURE_SLUGS.invite} className="px-6 mb-28 scroll-mt-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-6xl mx-auto bg-white rounded-[3rem] border border-gold-soft/60 shadow-2xl overflow-hidden grid lg:grid-cols-2"
        >
          <div className="relative bg-cream min-h-[320px] lg:min-h-full">
            {inviteImage && <img src={inviteImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          </div>
          <div className="p-8 md:p-14 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand text-gold-soft flex items-center justify-center"><Mail size={20} /></div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{invite.tag}</p>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">{moduleNames.invite}</h2>
            <p className="text-lg text-gray-600 leading-relaxed">{invite.summary}</p>
            <ul className="space-y-3">
              {invite.includes.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink/85 leading-relaxed">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0"><Check size={11} strokeWidth={3.5} /></span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href={`/${locale}/features/${FEATURE_SLUGS.invite}`}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 whitespace-nowrap rounded-full bg-brand text-gold-soft text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-dark transition-colors"
              >
                {dict.invite.detailBtn} <ArrowRight size={14} />
              </Link>
              {featured && (
                <Link
                  href={`/${locale}/preview/${featured.id}`}
                  className="inline-flex items-center justify-center h-12 px-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-ink hover:text-brand transition-colors"
                >
                  {dict.invite.liveBtn}
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── À VOLTA DO CONVITE ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 mb-28">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <Eyebrow>{dict.around.tag}</Eyebrow>
          <h2 className="font-serif text-3xl md:text-4xl text-ink">{dict.around.title}</h2>
          <p className="text-gray-500 text-lg">{dict.around.desc}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {AROUND_INVITE.map((id, i) => {
            const m = copy[id];
            const Icon = MODULE_ICONS[id];
            const img = featureImageSrc(id, FEATURE_IMAGES[id].concept, locale);
            return (
              <motion.div
                key={id}
                id={FEATURE_SLUGS[id]}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 2) * 0.1 }}
                className="scroll-mt-28"
              >
                <Link
                  href={`/${locale}/features/${FEATURE_SLUGS[id]}`}
                  className="group h-full flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-gold-soft transition-all duration-500"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                    {img && <img src={img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cream border border-gold-soft/60 text-brand flex items-center justify-center"><Icon size={18} /></div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{m.tag}</p>
                    </div>
                    <h3 className="font-serif text-3xl text-ink mb-3">{moduleNames[id]}</h3>
                    <p className="text-gray-600 leading-relaxed mb-5">{m.summary}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {m.includes.slice(0, 3).map(item => (
                        <li key={item} className="flex items-start gap-2.5 text-xs text-gray-500 leading-relaxed">
                          <Check size={13} className="text-brand shrink-0 mt-0.5" /> {item}
                        </li>
                      ))}
                    </ul>
                    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand">
                      {dict.discoverMore} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── TUDO LIGADO ──────────────────────────────────────────────── */}
      <section className="bg-ink py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-gold-soft italic text-center mb-16">{dict.connected.title}</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {(dict.connected.items as { title: string; desc: string }[]).map((item, i) => {
              const Icon = CONNECTED_ICONS[i] ?? Sparkles;
              return (
                <div key={i} className="text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full border border-gold-soft/30 text-gold-soft flex items-center justify-center"><Icon size={22} /></div>
                  <h3 className="font-bold text-white uppercase tracking-widest text-sm">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONVITE À MEDIDA ─────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 bg-gold-soft/25 border border-gold-soft rounded-[2.5rem] px-8 md:px-12 py-10 text-center md:text-left">
          <div>
            <h2 className="font-serif text-3xl text-ink">{dict.bespoke.title}</h2>
            <p className="text-gray-600 leading-relaxed mt-2">{dict.bespoke.desc}</p>
          </div>
          <Link href={`/${locale}#a-medida`} className="shrink-0 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand hover:text-ink transition-colors border-b border-brand pb-1">
            {dict.bespoke.link} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="pb-32 px-6 text-center">
        <h2 className="text-4xl font-serif text-ink mb-8">{dict.cta.title}</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href={`/${locale}/dashboard/new-invite`}
            className="inline-flex h-14 items-center justify-center px-10 rounded-full bg-brand text-gold-soft text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-dark transition-colors"
          >
            {dict.cta.btnPrimary}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink hover:text-brand transition-colors"
          >
            {dict.cta.btn} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
