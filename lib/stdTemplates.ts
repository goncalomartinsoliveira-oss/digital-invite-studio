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
};

export const STD_TEMPLATES: StdTemplate[] = [
  { id: "desenho", name: "Arco Dourado", svgUrl: "/std-templates/desenho.svg" },
  { id: "classic-arch", name: "Clássico (Arco)", svgUrl: "/std-templates/classic-arch.svg" },
  { id: "desenho2", name: "Moldura Preta", svgUrl: "/std-templates/desenho2.svg" },
];

export const DEFAULT_STD_TEMPLATE = STD_TEMPLATES[0];
