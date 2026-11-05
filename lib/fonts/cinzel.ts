import localFont from "next/font/local";

// Cinzel: só nos modelos de convite e no Save the Date — fica num módulo à
// parte para as outras páginas não a descarregarem.
// Ver public/fonts (ficheiros .woff2, licença OFL em public/fonts/licenses/) e o
// comentário de lib/fonts/README.md sobre porque é que as letras são locais.
// ATENÇÃO: o next/font/local lê estas opções em tempo de compilação — têm de ser
// valores literais (nada de variáveis nem `...`).

// preload: false — com letras locais o Next pré-carregaria esta letra em TODAS as
// rotas (a lista de pré-carregamento é global); assim só se descarrega quando uma
// página a usa mesmo. O mesmo vale para as outras letras de modelos (ver README).
// O nome do export é o nome de família que o Next dá à letra, e os nomes de família
// em CSS não distinguem maiúsculas: "cinzel" colidia com o alias 'Cinzel' de
// app/globals.css (levava a descarregar a letra duas vezes). Daí "cinzelFont".
export const cinzelFont = localFont({
  src: [{ path: "../../public/fonts/cinzel-latin-wght-normal.woff2", weight: "400 900", style: "normal" }],
  display: "swap",
  preload: false,
});

// O módulo Save the Date usa a Cinzel através de uma variável CSS própria.
export const cinzelStd = localFont({
  src: [{ path: "../../public/fonts/cinzel-latin-wght-normal.woff2", weight: "400 900", style: "normal" }],
  variable: "--font-cinzel-std",
  display: "swap",
  preload: false,
});
