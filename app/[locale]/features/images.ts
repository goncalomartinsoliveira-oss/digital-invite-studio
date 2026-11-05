import type { ModuleId } from "@/lib/modules";
import { FEATURE_SLUGS } from "./slugs";

// Imagens das páginas de funcionalidades (public/features/<slug>/).
//
// Lista explícita do que existe, em vez de tentar carregar e esconder no
// onError: numa página renderizada no servidor, a imagem em falta pode falhar
// antes de o React ligar o onError, e o visitante via o texto alternativo por
// cima de uma caixa vazia (era o que acontecia no convite).
//
// `locales`: versões que existem do ficheiro (<file>-pt.jpg / <file>-en.jpg),
// para imagens com texto de interface. Sem `locales`, é um único <file>.jpg.
// Se faltar a versão do idioma pedido, usa-se a primeira da lista.

type Locale = "pt" | "en";
type FeatureImage = { file: string; locales?: Locale[] };

const BOTH: Locale[] = ["pt", "en"];

export const FEATURE_IMAGES: Record<ModuleId, { concept?: FeatureImage; steps: FeatureImage[] }> = {
  save_the_date: {
    concept: { file: "00-concept", locales: BOTH },
    steps: [
      { file: "01-dashboard", locales: BOTH },
      { file: "02-cartao-gerado", locales: BOTH },
      { file: "03-partilhar" },
      { file: "04-recebido" },
    ],
  },
  invite: {
    concept: { file: "02-website" },
    steps: [
      { file: "01-dashboard", locales: BOTH },
      { file: "02-website" },
      { file: "03-partilhar", locales: BOTH },
      { file: "04-rsvp", locales: BOTH },
    ],
  },
  guests_seating: {
    concept: { file: "00-concept" },
    steps: [
      { file: "01-dashboard", locales: BOTH },
      { file: "02-mesas", locales: BOTH },
      { file: "03-rsvp-sincroniza", locales: ["pt"] },
      { file: "04-encontra-mesa", locales: ["en"] },
    ],
  },
  photo_sharing: {
    concept: { file: "00-concept" },
    steps: [
      { file: "01-dashboard", locales: BOTH },
      { file: "02-qr-evento" },
      { file: "03-mobile-galeria", locales: ["pt"] },
      { file: "04-live-wall", locales: ["pt"] },
    ],
  },
  guestbook: {
    concept: { file: "00-concept", locales: BOTH },
    steps: [
      { file: "01-dashboard", locales: BOTH },
      { file: "02-qr-evento" },
      { file: "03-convidado-mensagem" },
      { file: "04-casal-em-casa" },
    ],
  },
};

export function featureImageSrc(moduleId: ModuleId, img: FeatureImage | undefined, locale: string): string | null {
  if (!img) return null;
  const suffix = img.locales
    ? `-${img.locales.includes(locale as Locale) ? locale : img.locales[0]}`
    : "";
  return `/features/${FEATURE_SLUGS[moduleId]}/${img.file}${suffix}.jpg`;
}
