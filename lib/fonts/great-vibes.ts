import localFont from "next/font/local";

// Great Vibes: só no modelo Minimal.
// Ver public/fonts (ficheiros .woff2, licença OFL em public/fonts/licenses/) e o
// comentário de lib/fonts/README.md sobre porque é que as letras são locais.
// ATENÇÃO: o next/font/local lê estas opções em tempo de compilação — têm de ser
// valores literais (nada de variáveis nem `...`).

// preload: false — ver o comentário em cinzel.ts (o Next pré-carregaria em todas as rotas).
export const greatVibes = localFont({
  src: [{ path: "../../public/fonts/great-vibes-latin-400-normal.woff2", weight: "400", style: "normal" }],
  display: "swap",
  preload: false,
});
