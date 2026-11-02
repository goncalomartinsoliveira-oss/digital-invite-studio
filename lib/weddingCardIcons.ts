import { Church, Heart, Martini, UtensilsCrossed, Cake, Disc3, Users, Gem } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Ícones do cronograma do template "monogram-01" (e de qualquer outro que
// venha a usar o mesmo padrão) — uma lista fixa e pequena, não um picker de
// biblioteca inteira. Partilhada entre o editor (ContentModule, para
// escolher) e o template (para desenhar), para nunca desalinharem.
//
// A chave fica gravada em `content.program.events[].icon`. Undefined/chave
// desconhecida = sem ícone — mantém os templates mais antigos, que não têm
// este campo, a funcionar sem qualquer alteração.
export const PROGRAM_ICONS: Record<string, LucideIcon> = {
  rings: Gem,
  welcome: Users,
  church: Church,
  cocktail: Martini,
  dinner: UtensilsCrossed,
  cake: Cake,
  party: Disc3,
  heart: Heart,
};

export const PROGRAM_ICON_LABELS: Record<string, string> = {
  rings: "Alianças",
  welcome: "Receção",
  church: "Cerimónia",
  cocktail: "Cocktail",
  dinner: "Jantar",
  cake: "Bolo",
  party: "Festa",
  heart: "Coração",
};

export const PROGRAM_ICON_KEYS = Object.keys(PROGRAM_ICONS);
