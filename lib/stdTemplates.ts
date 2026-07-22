// Registo dos templates (bases) do Save the Date.
//
// Para adicionar um novo design (feito por si, num programa vetorial):
// 1) Exportar como SVG, com as mesmas "zonas" marcadas por id:
//    - #photoSlot          → elemento <image> onde a foto do casal é colocada
//    - #photoPlaceholder   → o que aparece antes de haver foto (ex.: gradiente)
//    - #photoEmptyLabel    → texto "A VOSSA FOTO" (ou equivalente)
//    - #namesSlot          → texto dos nomes do casal, numa única linha (ex.: "Noivo & Noiva")
//    - #metaSlot           → texto da data / cidade, numa única linha
//    Opcional, para designs com o nome da noiva e do noivo em linhas separadas
//    (o "&" faz parte do desenho, é fixo) e/ou data e cidade em zonas distintas:
//    - #brideNameSlot / #groomNameSlot  → nome da noiva / nome do noivo, cada um na sua linha
//    - #dateSlot / #citySlot            → data / cidade, cada uma na sua zona
// 2) Colocar o ficheiro em public/std-templates/.
// 3) Adicionar aqui uma entrada com o caminho do ficheiro.
export type StdTemplate = {
  id: string;
  name: string;
  svgUrl: string;
  // Área da foto no viewBox do SVG (mesmas unidades do desenho — todos os
  // templates usam viewBox 89.958331 × 169.33333). Usada para o controlo de
  // reposicionar/ampliar a foto (arrastar + zoom): garante que o que se vê
  // no controlo corresponde ao que sai no cartão. Templates sem foto (ex.:
  // "Tipográfico Bordô") não têm esta propriedade.
  photoBox?: { x: number; y: number; width: number; height: number };
};

export const STD_TEMPLATES: StdTemplate[] = [
  {
    id: "desenho", name: "Arco Dourado", svgUrl: "/std-templates/desenho.svg",
    photoBox: { x: 11.250182, y: 14.208109, width: 88.991798, height: 115.13313 },
  },
  {
    id: "desenho2", name: "Moldura Preta", svgUrl: "/std-templates/desenho2.svg",
    photoBox: { x: 12.596814, y: 30.134732, width: 64.759414, height: 64.759414 },
  },
  {
    id: "desenho3", name: "Linhas Clássicas", svgUrl: "/std-templates/desenho3.svg",
    photoBox: { x: 0.0397, y: 29.3210, width: 89.6276, height: 83.8359 },
  },
  { id: "desenho4", name: "Tipográfico Bordô", svgUrl: "/std-templates/desenho4.svg" },
];

export const DEFAULT_STD_TEMPLATE = STD_TEMPLATES[0];
