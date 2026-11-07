"use client";
import { useEffect, useRef, useState } from "react";
import { Move, ZoomIn, Crosshair } from "lucide-react";
import { normalizeCoverPosition, coverImageStyle, DEFAULT_COVER_POSITION, MAX_COVER_ZOOM, type CoverFrame, type CoverPosition } from "@/lib/coverFrame";

// "Enquadramento da foto" (painel › Convite › Capa): mostra a foto dentro da
// moldura do modelo, com o mesmo recorte do convite (lib/coverFrame.ts), e
// deixa arrastá-la e aproximá-la. A posição fica sempre dentro da foto: com
// object-cover e zoom ≥ 1 à volta de um ponto da própria foto, a moldura
// nunca fica com vazios. Durante o arrasto a posição é só local; grava-se ao
// largar (onChange), para não disparar o gravar automático a cada movimento.

type Dict = { title: string; hint: string; zoom: string; reset: string };

type Props = {
  url: string;
  frame: CoverFrame;
  value: unknown;
  onChange: (p: CoverPosition) => void;
  disabled?: boolean;
  dict: Dict;
};

export default function CoverFramer({ url, frame, value, onChange, disabled, dict }: Props) {
  const [pos, setPos] = useState<CoverPosition>(() => normalizeCoverPosition(value));
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; start: CoverPosition } | null>(null);

  // Quando o valor gravado muda por fora (ex.: foto nova), acompanhar.
  useEffect(() => { if (!drag.current) setPos(normalizeCoverPosition(value)); }, [value]);

  const commit = (p: CoverPosition) => { setPos(p); onChange(p); };

  // Quantos píxeis a foto anda por cada 1% de x/y, com object-cover e zoom:
  // a parte que transborda da moldura (object-position) mais o efeito de mudar
  // o centro do zoom. Se for 0 nesse eixo, a foto não se mexe nesse sentido.
  const pxPerPercent = (axis: "x" | "y", zoom: number) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box || !natural) return 0;
    const scale = Math.max(box.width / natural.w, box.height / natural.h);
    const overflow = axis === "x" ? natural.w * scale - box.width : natural.h * scale - box.height;
    const size = axis === "x" ? box.width : box.height;
    return (Math.max(0, overflow) * zoom + size * (zoom - 1)) / 100;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: pos };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const kx = pxPerPercent("x", d.start.zoom);
    const ky = pxPerPercent("y", d.start.zoom);
    setPos(normalizeCoverPosition({
      ...d.start,
      x: kx ? d.start.x - (e.clientX - d.x) / kx : d.start.x,
      y: ky ? d.start.y - (e.clientY - d.y) / ky : d.start.y,
    }));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    onChange(pos);
  };

  const isDefault = pos.x === 50 && pos.y === 50 && pos.zoom === 1;

  return (
    <div className="mt-6" data-cover-framer>
      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Move size={11} /> {dict.title}</p>
      <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{dict.hint}</p>
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div
          ref={boxRef}
          className={`relative w-full max-w-[240px] mx-auto sm:mx-0 select-none touch-none ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
          style={{ aspectRatio: frame.aspectRatio }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label={dict.title}
        >
          {/* A foto inteira, esbatida, para se ver o que fica de fora */}
          <div className="absolute inset-0 overflow-hidden rounded-lg opacity-25">
            <img src={url} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" style={coverImageStyle(pos)} />
          </div>
          {frame.background && <img src={frame.background} alt="" draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />}
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: frame.clipPath }}>
            <img
              src={url}
              alt=""
              draggable={false}
              onLoad={e => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="absolute inset-0 w-full h-full object-cover"
              style={coverImageStyle(pos)}
            />
          </div>
          {/* Molduras sem desenho próprio (ex.: círculo): contorno para se ver o limite. */}
          {!frame.background && frame.clipPath?.startsWith("circle") && (
            <div className="absolute inset-0 rounded-full ring-2 ring-[#630100]/40 pointer-events-none" />
          )}
        </div>

        <div className="w-full sm:flex-1 space-y-4">
          <label className="block">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><ZoomIn size={11} /> {dict.zoom}</span>
            <input
              type="range"
              min={1}
              max={MAX_COVER_ZOOM}
              step={0.05}
              value={pos.zoom}
              disabled={disabled}
              onChange={e => setPos(p => ({ ...p, zoom: Number(e.target.value) }))}
              onPointerUp={() => onChange(pos)}
              onKeyUp={() => onChange(pos)}
              onBlur={() => onChange(pos)}
              className="w-full accent-[#630100]"
              aria-label={dict.zoom}
            />
          </label>
          <button
            type="button"
            disabled={disabled || isDefault}
            onClick={() => commit(DEFAULT_COVER_POSITION)}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand border border-gray-200 hover:border-gold-soft rounded-full px-3 py-1.5 transition-all disabled:opacity-40"
          >
            <Crosshair size={12} /> {dict.reset}
          </button>
        </div>
      </div>
    </div>
  );
}
