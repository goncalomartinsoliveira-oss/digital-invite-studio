"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Hand, ArrowDown, Search, Info, X, RotateCcw, Sparkles } from "lucide-react";
import { useBrand } from "./BrandProvider";
import pt from "@/dictionaries/pt";
import en from "@/dictionaries/en";

const dictionaries = { pt, en };

// Sala de demonstração de um modelo (app/[locale]/preview/[id]).
// Um único iframe com o convite de exemplo (/preview/<id>/convite):
//   - computador (lg+): dentro de um telemóvel, escalado para caber na altura
//     do ecrã, com o painel do modelo à esquerda;
//   - telemóvel: em ecrã inteiro, com uma barra fixa em baixo e o painel numa
//     folha que sobe ao tocar em "i".

const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 14;
const PHONE_W = SCREEN_W + BEZEL * 2;
const PHONE_H = SCREEN_H + BEZEL * 2;
const TRY_ICONS = [Hand, ArrowDown, Search];

type Props = {
  locale: "pt" | "en";
  template: { id: string; name: string; desc: string };
  others: { id: string; name: string; phone: string }[];
};

export default function PreviewShowroom({ locale, template, others }: Props) {
  const dict = dictionaries[locale]?.PreviewShowroom || dictionaries.pt.PreviewShowroom;
  const brand = useBrand();
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [scale, setScale] = useState(1);
  const [frameKey, setFrameKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  const liveSrc = `/${locale}/preview/${template.id}/convite`;
  const useHref = `/${locale}/dashboard/new-invite`;
  const bespokeHref = `/${locale}#a-medida`;

  useEffect(() => {
    setPageUrl(window.location.origin + window.location.pathname);
    const mq = window.matchMedia("(min-width: 1024px)");
    const fit = () => {
      setIsDesktop(mq.matches);
      const stage = stageRef.current;
      if (!stage) return;
      const s = Math.min(1, (stage.clientHeight - 56) / PHONE_H, (stage.clientWidth - 32) / PHONE_W);
      setScale(Math.max(0.5, s));
    };
    fit();
    window.addEventListener("resize", fit);
    mq.addEventListener("change", fit);
    return () => { window.removeEventListener("resize", fit); mq.removeEventListener("change", fit); };
  }, []);

  const goBack = () => {
    const sameOrigin = document.referrer && new URL(document.referrer).origin === window.location.origin;
    if (sameOrigin && window.history.length > 1) router.back();
    else router.push(`/${locale}`);
  };

  const panel = (inSheet: boolean) => (
    <div className="space-y-7">
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{dict.eyebrow}</p>
        <h1 className="font-serif text-4xl xl:text-5xl text-ink leading-tight">{template.name}</h1>
        <p className="text-gray-600 leading-relaxed">{template.desc}</p>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{dict.tryTitle}</p>
        <ul className="space-y-3">
          {(dict.try as string[]).map((t, i) => {
            const Icon = TRY_ICONS[i] ?? Sparkles;
            return (
              <li key={i} className="flex items-start gap-3 text-sm text-ink/85 leading-relaxed">
                <span className="w-8 h-8 rounded-full bg-white border border-gold-soft/70 text-brand flex items-center justify-center shrink-0"><Icon size={14} /></span>
                <span className="pt-1.5">{t}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href={useHref}
          className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-brand text-gold-soft text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-dark transition-colors"
        >
          {dict.useBtn}
        </Link>
        <Link
          href={bespokeHref}
          className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-gold-soft bg-white/60 text-ink text-[10px] font-bold uppercase tracking-widest hover:border-brand hover:text-brand transition-colors"
        >
          {dict.bespokeBtn}
        </Link>
      </div>

      {!inSheet && pageUrl && (
        <div className="flex items-center gap-5 bg-white rounded-3xl border border-gold-soft/60 p-5">
          <div className="shrink-0 p-2 bg-cream rounded-2xl">
            <QRCodeSVG value={pageUrl} size={96} fgColor="#332E2B" bgColor="transparent" />
          </div>
          <div>
            <p className="font-serif text-xl text-ink leading-tight">{dict.qrTitle}</p>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">{dict.qrDesc}</p>
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{dict.otherTemplates}</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {others.map(o => (
              <Link key={o.id} href={`/${locale}/preview/${o.id}`} className="shrink-0 w-20 text-center group">
                <img src={o.phone} alt="" className="w-20 rounded-xl border border-gold-soft/60 group-hover:border-brand transition-colors" />
                <span className="block mt-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-brand">{o.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400 leading-relaxed">{dict.demoNote}</p>
    </div>
  );

  return (
    <div className="bg-cream min-h-dvh lg:h-dvh lg:overflow-hidden flex flex-col">
      {/* Barra de cima (só computador) */}
      <header className="hidden lg:flex h-16 shrink-0 items-center justify-between px-8 border-b border-gold-soft/50">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand transition-colors">
          <ArrowLeft size={14} /> {dict.back}
        </button>
        <Link href={`/${locale}`} aria-label={brand?.logoAlt ?? "Digital Invite Studio"}>
          <img src={brand?.logo ?? "/logo-dis.svg"} alt={brand?.logoAlt ?? "Digital Invite Studio"} className="h-9 w-auto" />
        </Link>
        <span className="w-24" />
      </header>

      <main className="flex-1 min-h-0 lg:grid lg:grid-cols-[minmax(320px,420px)_1fr] lg:gap-12 lg:px-12 xl:px-20">
        {/* Painel do modelo (computador) */}
        <aside className="hidden lg:flex flex-col py-8 overflow-y-auto">
          <div className="my-auto">{panel(false)}</div>
        </aside>

        {/* O convite */}
        <div ref={stageRef} className="relative lg:flex lg:flex-col lg:items-center lg:justify-center lg:py-4 lg:min-h-0">
          <div className="hidden lg:block absolute w-[520px] h-[520px] rounded-full bg-gold-soft/40 blur-3xl pointer-events-none" />
          <div style={isDesktop ? { width: PHONE_W * scale, height: PHONE_H * scale } : undefined} className="relative">
            <div
              style={isDesktop ? { width: PHONE_W, height: PHONE_H, transform: `scale(${scale})`, transformOrigin: "top left" } : undefined}
              className="lg:rounded-[3.4rem] lg:border-[14px] lg:border-ink lg:bg-ink lg:shadow-[0_40px_90px_-30px_rgba(51,46,43,0.55)] lg:overflow-hidden relative"
            >
              <iframe
                key={frameKey}
                src={liveSrc}
                title={`${template.name} · ${dict.eyebrow}`}
                className="block w-full h-[calc(100dvh-4rem)] lg:h-full border-0 bg-white lg:rounded-[2.5rem]"
              />
              <div className="hidden lg:block absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-7 bg-ink rounded-full pointer-events-none" />
            </div>
          </div>
          <button
            onClick={() => setFrameKey(k => k + 1)}
            className="hidden lg:inline-flex relative mt-4 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand transition-colors"
          >
            <RotateCcw size={13} /> {dict.restart}
          </button>
        </div>
      </main>

      {/* Barra de baixo (telemóvel) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur border-t border-gold-soft/60 flex items-center gap-2 px-3 z-40">
        <button onClick={goBack} aria-label={dict.back} className="w-11 h-11 rounded-full flex items-center justify-center text-gray-500 hover:text-brand">
          <ArrowLeft size={18} />
        </button>
        <button onClick={() => setSheetOpen(true)} aria-label={dict.info} className="w-11 h-11 rounded-full border border-gold-soft flex items-center justify-center text-brand">
          <Info size={18} />
        </button>
        <Link href={useHref} className="flex-1 h-11 rounded-full bg-brand text-gold-soft text-[10px] font-bold uppercase tracking-widest flex items-center justify-center">
          {dict.useBtn}
        </Link>
      </div>

      {/* Folha com o painel (telemóvel) */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="backdrop"
              className="lg:hidden fixed inset-0 bg-ink/40 z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              key="sheet"
              role="dialog"
              aria-label={dict.info}
              className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-cream rounded-t-[2rem] max-h-[85dvh] overflow-y-auto px-6 pt-4 pb-10 shadow-2xl"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="w-10 h-1 rounded-full bg-gray-300 mx-auto" />
                <button onClick={() => setSheetOpen(false)} aria-label={dict.close} className="absolute right-4 top-3 w-10 h-10 rounded-full flex items-center justify-center text-gray-500">
                  <X size={18} />
                </button>
              </div>
              {panel(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
