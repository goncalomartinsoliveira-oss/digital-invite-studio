import localFont from "next/font/local";

// Letras do layout raiz: carregadas em TODAS as páginas.
// Ver public/fonts (ficheiros .woff2, licença OFL em public/fonts/licenses/) e o
// comentário de lib/fonts/README.md sobre porque é que as letras são locais.
// ATENÇÃO: o next/font/local lê estas opções em tempo de compilação — têm de ser
// valores literais (nada de variáveis nem `...`).

export const cormorant = localFont({
  src: [
    { path: "../../public/fonts/cormorant-garamond-latin-wght-normal.woff2", weight: "300 700", style: "normal" },
    { path: "../../public/fonts/cormorant-garamond-latin-wght-italic.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

// "jostFont" e não "jost": ver a nota em cinzel.ts (colidiria com o alias 'Jost').
export const jostFont = localFont({
  src: [{ path: "../../public/fonts/jost-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-jost",
  display: "swap",
});

export const pinyon = localFont({
  src: [{ path: "../../public/fonts/pinyon-script-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-pinyon",
  display: "swap",
});
