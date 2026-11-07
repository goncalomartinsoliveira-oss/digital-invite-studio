// Enquadramento da foto de capa (posição e zoom dentro da moldura do modelo).
// Usado pelo template (Renaissance Blue) e pelo editor do painel (CoverFramer),
// para os dois mostrarem exatamente o mesmo recorte.
//
// Gravado em content.hero.main_image_position = { x, y, zoom }:
//   x, y  — ponto em destaque, em % da foto (0–100; 50/50 = centro). Serve de
//           object-position (escolhe o que se corta) e de centro do zoom.
//   zoom  — 1 a 3. Com object-cover e zoom ≥ 1 à volta de um ponto da própria
//           foto, a moldura fica sempre preenchida: nunca aparecem vazios.
import type { CSSProperties } from "react";

export type CoverPosition = { x: number; y: number; zoom: number };
export const DEFAULT_COVER_POSITION: CoverPosition = { x: 50, y: 50, zoom: 1 };
export const MAX_COVER_ZOOM = 3;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function normalizeCoverPosition(p: any): CoverPosition {
  if (!p || typeof p !== "object") return DEFAULT_COVER_POSITION;
  const n = (v: any, d: number) => (typeof v === "number" && isFinite(v) ? v : d);
  return {
    x: clamp(n(p.x, 50), 0, 100),
    y: clamp(n(p.y, 50), 0, 100),
    zoom: clamp(n(p.zoom, 1), 1, MAX_COVER_ZOOM),
  };
}

// Estilo da <img> (object-cover) dentro da moldura recortada.
export function coverImageStyle(p: any): CSSProperties {
  const { x, y, zoom } = normalizeCoverPosition(p);
  return {
    objectPosition: `${x}% ${y}%`,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${x}% ${y}%`,
  };
}

// Forma exata do pentágono do envelope aberto (ficheiro fonte do Renaissance Blue).
export const ENVELOPE_PHOTO_CLIP =
  "polygon(89.25% 36.62%, 55.81% 8.35%, 55.75% 8.29%, 55.59% 8.13%, 55.34% 7.89%, 55.02% 7.59%, 54.65% 7.25%, 54.26% 6.9%, 53.86% 6.56%, 53.47% 6.24%, 53.11% 5.98%, 52.8% 5.79%, 51.82% 5.33%, 50.84% 5.2%, 49.89% 5.32%, 48.99% 5.63%, 48.16% 6.07%, 47.43% 6.57%, 46.83% 7.08%, 46.36% 7.52%, 46.07% 7.83%, 45.96% 7.95%, 12.43% 36.52%, 12.3% 36.63%, 11.95% 36.96%, 11.42% 37.49%, 10.8% 38.21%, 10.14% 39.11%, 9.49% 40.18%, 8.93% 41.41%, 8.5% 42.78%, 8.28% 44.28%, 8.32% 45.9%, 8.38% 45.92%, 8.56% 45.99%, 8.83% 46.1%, 9.17% 46.26%, 9.58% 46.45%, 10.04% 46.68%, 10.52% 46.95%, 11.01% 47.26%, 11.49% 47.59%, 11.95% 47.96%, 32.62% 64.65%, 68.67% 64.54%, 90.84% 46.97%, 91.23% 46.74%, 91.61% 46.53%, 91.97% 46.34%, 92.3% 46.18%, 92.6% 46.04%, 92.86% 45.93%, 93.08% 45.84%, 93.24% 45.78%, 93.34% 45.74%, 93.38% 45.73%, 93.42% 44.12%, 93.19% 42.64%, 92.77% 41.3%, 92.2% 40.11%, 91.55% 39.08%, 90.89% 38.22%, 90.26% 37.53%, 89.74% 37.03%, 89.38% 36.73%, 89.25% 36.62%)";

export type CoverFrame = { aspectRatio: string; clipPath?: string; background?: string };

// Moldura da capa por modelo. Só os modelos com moldura mostram a ferramenta
// "Enquadramento da foto" no painel.
const RENAISSANCE_FRAME: CoverFrame = {
  aspectRatio: "1103 / 1426",
  clipPath: ENVELOPE_PHOTO_CLIP,
  background: "/renaissance-blue-01/elementos/envelope-aberto.webp",
};
// Moldura redonda (ex.: foto de "A Nossa História" no Renaissance Blue).
export const CIRCLE_FRAME: CoverFrame = { aspectRatio: "1 / 1", clipPath: "circle(50% at 50% 50%)" };

export const COVER_FRAMES: Record<string, CoverFrame> = {
  "renaissance-blue-01": RENAISSANCE_FRAME,
  "envelope-01-jose-e-dalia": RENAISSANCE_FRAME,
};
