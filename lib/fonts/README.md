# Letras do site

As letras vivem em `public/fonts/*.woff2` (subconjunto "latin", ficheiros variáveis,
pacotes `@fontsource`, licença OFL — ver `public/fonts/licenses/`) e são declaradas aqui
com `next/font/local`, em vez de `next/font/google`.

**Porquê:** com `next/font/google` o build descarrega as letras do Google em cada
compilação. Quando esse pedido falhava, o build de produção no Vercel rebentava
("npm run build exited with 1", ao fim de ~30 s, até em commits só de documentação) e
passava a seguir num Redeploy. Com ficheiros locais o build deixa de depender da rede.
(Testado: `next build` com a rede bloqueada compila.)

**Estrutura:** um módulo por grupo de utilização, de propósito — uma página só descarrega
as letras dos módulos que importa.

| Módulo | Letras | Quem usa |
|---|---|---|
| `layout.ts` | Cormorant Garamond, Jost (`jostFont`), Pinyon Script | layout raiz (todas as páginas) |
| `cinzel.ts` | Cinzel (`cinzelFont`, `cinzelStd`) | modelos Minimal, Luxury, Renaissance Blue; Save the Date |
| `great-vibes.ts` | Great Vibes | modelo Minimal |
| `passions-conflict.ts` | Passions Conflict | modelo Luxury |

**Nomes dos `export`:** o `next/font/local` usa o nome do `export` como nome de família CSS, e os nomes de família
não distinguem maiúsculas — um `export const jost` colidiria com o alias `'Jost'` (letra descarregada duas vezes). Por isso
`jostFont` e `cinzelFont`. Evitar exports com o mesmo nome (sem maiúsculas) de um alias de `globals.css`.

**`preload: false`:** com `next/font/local` o Next lista as letras de **todas** as rotas para pré-carregar
(medido: a página inicial pré-carregava a Great Vibes). Por isso as letras que só servem alguns modelos
(`cinzel.ts`, `great-vibes.ts`, `passions-conflict.ts`) têm `preload: false`: descarregam-se só quando uma
página as usa. As do layout (`layout.ts`) pré-carregam-se, porque são usadas em todo o lado.

**Aliases com o nome verdadeiro:** os SVG do Save the Date (`public/std-templates`) referem as
letras pelo nome (`'Pinyon Script'`, `Jost`, `'Cormorant Garamond'`, `Cinzel`). O `next/font/local`
dá às letras nomes internos, por isso `app/globals.css` declara `@font-face` com os nomes
verdadeiros, a apontar para os mesmos ficheiros.

**Para acrescentar uma letra:** copiar o `.woff2` "latin" para `public/fonts/`, declará-la num
módulo (valores literais!) e, se for usada pelo nome num SVG/CSS, acrescentar o alias em `globals.css`.
**Depois de mexer nas letras:** comparar capturas antes/depois (a mudança deve ser invisível).
