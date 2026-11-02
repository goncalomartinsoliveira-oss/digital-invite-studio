# Elementos da hero redesenhada (Dália & José, nov/2026)

Hero em colagem totalmente refeita a pedido do casal — layout, elementos e
posições diferentes do "envelope-01" original (ver pasta `public/envelope-01/`
para os elementos desse modelo, que continua inalterado para os outros
casais). Estes ficheiros chegaram como SVG com as imagens embutidas
(~2-6 MB cada, ~25 MB ao todo) e foram extraídos para PNG na resolução
nativa e convertidos para WebP: **~25 MB → ~2,3 MB**, sem perda visível.

| Ficheiro | Onde aparece |
|---|---|
| `envelope-aberto.webp` | Topo da colagem — forro é a foto de capa |
| `capa-floral-default.webp` | Visual por omissão do forro, antes de o casal carregar foto |
| `bouquet-cascante.webp` | Junto ao envelope, e repetido no fundo da colagem |
| `etiqueta-nomes.webp` | Nomes, data e local do casamento |
| `peonia.webp` | Decorativo |
| `busto.webp` | Decorativo |
| `bouquet-calla.webp` | Decorativo — só no ramo final, fundo da colagem |
| `hortensias-densas.webp` | Decorativo — junto ao coração (ficheiro fonte `10.svg`; ver nota abaixo) |
| `forma-circulo.webp` | Decorativo (mancha de cor) |
| `coracao-renda.webp` | Decorativo |
| `pandeiro.webp` | Decorativo |
| `hortensias.webp` | Decorativo — buquê mais solto (ficheiro fonte `12.svg`) |
| `etiqueta-detalhes.webp` | Navegação → "Local" |

## Posições

**Não são estimadas.** A primeira versão desta colagem foi medida sobre uma
maquete em imagem (grelha de 5% sobreposta, comparação lado-a-lado com a
renderização real) e depois afinada por pedidos de "mover X px" — processo
lento e impreciso, como o casal reparou. A versão atual vem de um SVG com
as imagens por **link** em vez de embutidas (`mockup_link.svg`, pedido
especificamente por ser leve o suficiente para abrir — um SVG com imagens
embutidas da composição toda ronda os 35 MB, grande demais para as
ferramentas disponíveis): cada elemento tem aí o seu `transform`
(`translate`/`scale`/`rotate`) exato, lido diretamente e convertido para
percentagem do `viewBox` (454.4 × 1216.62 → dá `CANVAS_H`). A ordem dos
elementos nesse ficheiro é também a ordem de empilhamento em `PIECES`.

Se for preciso ajustar o arranjo outra vez, o caminho mais rápido e exato
é pedir ao casal um novo SVG assim (Illustrator: exportar com
"Image Location: Link", não "Embed") com a composição já no sítio
certo — não tentar adivinhar por descrição ou marcações em capturas de
ecrã.

### `forma-circulo.webp` é um recorte, não o ficheiro inteiro

A imagem fonte ("Formas Azuis de Papel Texturado.png") tem duas formas
lado a lado (um oval alto e um círculo); o `mockup_link.svg` usa só o
círculo, recortado por um `clipPath` com um `<rect>`. O ficheiro aqui já
vem pré-recortado a essa janela exata (via ImageMagick, coordenadas
convertidas do espaço do `rect` para pixels da imagem fonte, dividindo
pela escala do `transform`) — não é a imagem completa.

### Duas hortênsias diferentes, não uma trocada pela outra

`12.svg` (buquê mais solto, confirmado por correspondência exata de
dimensões com o `mockup_link.svg`) e `10.svg` (mais denso, quatro maços
de hortênsia — duas azuis, duas brancas — bem juntos, sem caules
visíveis) são imagens **diferentes**, não a mesma trocada. A primeira
tentativa pôs `10.svg` no sítio do `12.svg` (`hortensias.webp`, junto à
etiqueta "Detalhes" azul); o casal corrigiu — essa posição é mesmo
`12.svg`, e `10.svg` vai no `bouquetCalla` (junto ao coração, por cima
do ramo de copo-de-leite que lá estava), daí o ficheiro novo
`hortensias-densas.webp`. **Cuidado ao reajustar outra vez: não assumir
que só há uma "hortênsia" na composição** — confirmado por captura de
ecrã com caixas e nomes de ficheiro sobrepostos a cada peça (ver
histórico da conversa), não só pela posição.

## Forro do envelope (foto de capa)

Mesma técnica do `envelope-01` original — `clip-path: polygon(...)` com a
forma exata do pentágono de cantos arredondados, desta vez lida do
`clipPath` do ficheiro SVG fonte (`path id` dentro de `<clipPath id="clippath">`)
e convertida em polígono percentual amostrando as curvas Bézier em ~60
pontos (não um polígono de poucos pontos a aproximar a olho). Ver
`ENVELOPE_PHOTO_CLIP` em `page.tsx`.

Ao contrário do `envelope-01` original (onde a foto entra por baixo, pelo
buraco já recortado no `.webp`), aqui a foto entra **por cima** do
`envelope-aberto.webp`, com o `clip-path` a fazer o recorte em CSS — o
ficheiro fonte já veio estruturado assim (duas camadas SVG: exterior do
envelope sem buraco, e grupo `"imagem_de_capa"` com `clip-path` próprio por
cima). Sem foto do casal carregada, mostra `capa-floral-default.webp` (o
padrão floral que já vinha desenhado para esse efeito).

## O que mudou em relação ao "envelope-01" original

A pedido do casal, esta colagem **não tem** polaroids da galeria nem os
badges ilustrados de "Confirmar Presença" / "A Nossa História" (só
"Detalhes"→Local tem equivalente visual, a etiqueta azul). Esses dois
atalhos continuam acessíveis, mas como uma navegação de texto simples por
baixo da colagem (`<nav>` com dois links), não como elementos ilustrados
dentro dela.

## Se precisar de ajustar outra vez

Substituir o `.webp` mantendo as mesmas proporções; se mudarem, reajustar
as posições em `PIECES`, no topo de `page.tsx`. Se for preciso medir de
novo contra uma maquete nova, o mais fiável é sobrepor uma grelha de
percentagem à imagem (como se fez aqui) e comparar lado-a-lado com uma
captura de ecrã real do template — não estimar só pela descrição.

### Cuidado com `position:relative` a tapar conteúdo a seguir

A faixa de navegação ("Confirmar Presença" / "A Nossa História") logo
a seguir ao `<div>` da colagem ficava tapada pelo ramo final, mesmo
vindo depois no DOM — porque esse `<div>` tem `position:relative`, e um
elemento posicionado pinta sempre por cima de um irmão seguinte sem
posição própria, seja qual for a ordem no DOM. A correção foi dar também
`relative z-20` a essa navegação (não mexer em espaçamento/padding, que
não resolvia a causa).
