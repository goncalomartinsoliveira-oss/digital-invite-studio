// Registo único dos modelos de convite que os casais podem escolher.
//
// A página inicial (montra), o seletor do editor (DesignModule) e a criação de
// um evento novo leem todos daqui. Para pôr um modelo novo no ar:
//   1. Criar o desenho em app/[locale]/templates/<id>/page.tsx.
//   2. Ligá-lo em app/[locale]/invite/[slug]/page.tsx (escolha por template_id).
//   3. Juntar o desenho e os dados fictícios em app/[locale]/preview/demos.tsx
//      (TEMPLATE_DEMOS). A sala de demonstração /preview/<id> aparece sozinha.
//   4. Imagens: public/home/tpl-<id>.jpg (telemóvel, 480×984, o topo do convite)
//      e uma miniatura para o seletor (proporção 4:3).
//   5. Acrescentar a entrada em INVITE_TEMPLATES e baixar COMING_SOON_SLOTS.
// Um id ligado no passo 2 mas fora desta lista é um modelo à medida: só o
// evento que o usa o vê, e o editor esconde-lhe o seletor.

export type InviteTemplate = {
  id: string;
  name: string;
  thumb: string;          // miniatura do seletor do editor (4:3)
  phone: string;          // captura em telemóvel para a montra da página inicial (480×984)
  supportsTheme?: boolean; // tem "Cor de Destaque" (um único token de cor em todo o desenho)
  desc: { pt: string; en: string };
};

export const INVITE_TEMPLATES: InviteTemplate[] = [
  {
    id: "renaissance-blue-01",
    name: "Renaissance Blue",
    thumb: "/renaissance-blue-01/preview.webp",
    phone: "/home/tpl-renaissance-blue-01.jpg",
    desc: {
      pt: "Envelope azul com selo de cera e colagem de hortênsias, em azul-céu e creme.",
      en: "A blue envelope with a wax seal and a hydrangea collage, in sky blue and cream.",
    },
  },
];

// Lugares "Em breve" mostrados na montra e no seletor enquanto os próximos
// modelos não estão prontos. Baixar à medida que forem entrando na lista acima.
export const COMING_SOON_SLOTS = 5;

// Modelo gravado em cada evento novo.
export const DEFAULT_TEMPLATE_ID = "renaissance-blue-01";

// ids antigos que apontam para um modelo da lista (o evento da Dália e do José
// ainda grava o id com que o Renaissance Blue nasceu).
export const LEGACY_TEMPLATE_IDS: Record<string, string> = {
  "envelope-01-jose-e-dalia": "renaissance-blue-01",
};

// Modelos retirados do seletor (nov. 2026). O código que os desenha continua em
// app/[locale]/templates/ para os convites que já os usam não deixarem de abrir;
// estes eventos continuam a ver o seletor, para poderem mudar de modelo.
export const RETIRED_TEMPLATE_IDS = [
  "luxury-01", "minimal-01", "collage-01", "classic-01", "noir-01", "arch-01", "envelope-01",
];

export function resolveTemplateId(id: string | null | undefined): string | null {
  if (!id) return null;
  return LEGACY_TEMPLATE_IDS[id] ?? id;
}

export function findTemplate(id: string | null | undefined): InviteTemplate | undefined {
  const resolved = resolveTemplateId(id);
  return INVITE_TEMPLATES.find(t => t.id === resolved);
}
