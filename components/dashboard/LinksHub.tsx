"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, ExternalLink, Lock, Download, Store } from "lucide-react";
import { downloadQRAsPng, downloadQRAsSvg } from "@/lib/qrDownload";
import type { ModuleId } from "@/lib/modules";

// "Links e QR codes": todos os endereços públicos do evento num só sítio.
// Antes estavam espalhados pelos módulos (QR do RSVP em Convidados, QR da
// galeria em Photo Sharing, etc.) — aqui o casal copia, abre ou descarrega o
// QR de qualquer um sem ter de adivinhar onde está. Os módulos continuam a
// mostrar os seus QR; esta vista é só um atalho central, não uma segunda fonte.

type LinkKey = "invite" | "rsvp" | "seating" | "moments" | "livewall" | "guestbook";

const LINKS: { key: LinkKey; path: string; module: ModuleId }[] = [
  { key: "invite", path: "invite", module: "invite" },
  { key: "rsvp", path: "rsvp", module: "guests_seating" },
  { key: "seating", path: "seating", module: "guests_seating" },
  { key: "moments", path: "moments", module: "photo_sharing" },
  { key: "livewall", path: "live-wall", module: "photo_sharing" },
  { key: "guestbook", path: "guestbook", module: "guestbook" },
];

type Dict = {
  title: string;
  subtitle: string;
  copy: string;
  copied: string;
  open: string;
  locked: string;
  items: Record<LinkKey, { title: string; desc: string }>;
  vendorsTitle: string;
  vendorsDesc: string;
  vendorsBtn: string;
};

type Props = {
  slug: string;
  locale: string;
  isLocked: (moduleId: ModuleId) => boolean;
  showVendors: boolean;
  onOpenVendors: () => void;
  onCopy?: (key: LinkKey) => void;
  dict: Dict;
};

export default function LinksHub({ slug, locale, isLocked, showVendors, onOpenVendors, onCopy, dict }: Props) {
  const [origin, setOrigin] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const copy = async (key: LinkKey, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      onCopy?.(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 2000);
    } catch {
      /* sem permissão de área de transferência — o utilizador pode copiar do campo */
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-2xl text-ink">{dict.title}</h2>
        <p className="text-gray-400 text-sm mt-1">{dict.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {LINKS.map(l => {
          const url = `${origin}/${locale}/${l.path}/${slug}`;
          const locked = isLocked(l.module);
          const qrId = `qr-links-${l.key}`;
          const item = dict.items[l.key];
          return (
            <div key={l.key} data-link={l.key} className={`bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex gap-5 ${locked ? "opacity-60" : ""}`}>
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  {origin && !locked ? (
                    <QRCodeSVG id={qrId} value={url} size={96} />
                  ) : (
                    <div className="w-[96px] h-[96px] flex items-center justify-center text-gray-300">
                      <Lock size={22} />
                    </div>
                  )}
                </div>
                {!locked && origin && (
                  <div className="flex gap-1.5">
                    <button onClick={() => downloadQRAsPng(qrId, `QR-${l.key}-${slug}`)} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand">
                      <Download size={10} /> PNG
                    </button>
                    <button onClick={() => downloadQRAsSvg(qrId, `QR-${l.key}-${slug}`)} className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand">
                      SVG
                    </button>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 flex flex-col">
                <h3 className="font-serif text-lg text-ink leading-snug">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mt-1">{item.desc}</p>
                {locked ? (
                  <span className="mt-auto pt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Lock size={11} /> {dict.locked}
                  </span>
                ) : (
                  <>
                    <p className="mt-3 text-[10px] text-gray-400 truncate font-mono bg-cream rounded-lg px-2.5 py-1.5" title={url}>{url}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => copy(l.key, url)}
                        className="flex items-center gap-1.5 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all"
                      >
                        {copiedKey === l.key ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        {copiedKey === l.key ? dict.copied : dict.copy}
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all"
                      >
                        {dict.open} <ExternalLink size={12} />
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showVendors && (
        <div className="mt-8 bg-cream border border-gold-soft/70 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gold-soft/70 flex items-center justify-center text-brand shrink-0">
            <Store size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg text-ink">{dict.vendorsTitle}</h3>
            <p className="text-gray-500 text-xs mt-1">{dict.vendorsDesc}</p>
          </div>
          <button
            onClick={onOpenVendors}
            className="bg-white text-brand border border-gold-soft px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
          >
            {dict.vendorsBtn}
          </button>
        </div>
      )}
    </div>
  );
}
