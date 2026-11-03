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
| `bouquet-calla.webp` | Decorativo — ao lado do círculo "Save the Date" |
| `hortensias-densas.webp` | Decorativo — por baixo do coração "Detalhes" (`10.svg`) |
| `forma-circulo.webp` | Decorativo (mancha de cor) |
| `coracao-renda.webp` | Decorativo |
| `pandeiro.webp` | Decorativo |
| `hortensias.webp` | Decorativo — canto inferior direito (`12.svg`; ver nota abaixo) |
| `etiqueta-detalhes.webp` | Losango azul — navegação → "Confirmar Presença" (RSVP) |
| `entrada-fundo.webp` | Fundo de seda do ecrã de entrada (envelope fechado) |
| `entrada-envelope.webp` | Envelope azul com selo de cera do ecrã de entrada |

## Tipos de letra

Todo o texto do convite é **Cinzel**; só os títulos de exibição (nomes,
"Casamento", "Detalhes", "Save the Date", "RSVP", títulos de secção)
ficam em **Pinyon Script**. O formulário de RSVP é o componente partilhado
`SmartRsvp`, que define a própria fonte por classes; aqui força-se Cinzel
só dentro de um bloco `.rsvp-cinzel` com uma regra `!important`, para não
afetar os outros modelos. Cinzel não tem itálico nem pesos abaixo de 400 —
não usar `italic` nem `font-light` neste template (dá oblíquo sintético).

## Ecrã de entrada (envelope fechado)

Redesenhado a partir da maquete "Carolina e Pedro": fundo de seda, nomes
em script (Pinyon, `TEXT_BLUE`) por cima do envelope azul, "Clique para
abrir" por baixo. Os ficheiros chegaram com resolução muito alta
(envelope 6116×4403, fundo 1872×3832; ~15 MB) e foram reduzidos para
1200 px e 1100 px de largura (**~110 KB e ~21 KB**). No envelope, os
pixéis quase transparentes soltos à volta (resíduo da remoção do fundo,
invisíveis em fundo claro mas visíveis em alguns visualizadores) foram
limpos e a imagem recortada ao envelope.

A maquete tem ainda, por baixo do envelope, o nome do convidado ("Ana e
Tiago") e "Iremos reservar (2) lugares para vocês". Isso exige convites
personalizados por convidado, que o sistema ainda não tem — hoje os
convidados confirmam procurando o próprio nome em `SmartRsvp`. Por isso
essas duas linhas **não estão** no template.

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

### Dois ramos parecidos, posições diferentes — não confundir

O `mockup_link.svg` tem, por esta ordem de cima para baixo:

- **Ramo de copo-de-leite** (`bouquet-calla.webp`, `6.svg`) — ao lado do
  círculo "Save the Date" (peça `bouquetCalla`). Aparece **uma só vez**.
- **"Buquê de Hortênsias"** (`hortensias-densas.webp`, `10.svg`, 1536×1024,
  quatro maços azuis/brancos sem caules) — por baixo do coração "Detalhes"
  (peça `hortensiasCoracao`, rodada 20.5°).
- **"Buquê Floral Branco e Azul"** (`hortensias.webp`, `12.svg`,
  1199×1312, com copos-de-leite) — no canto inferior direito, sobre a
  etiqueta azul em losango (peça `hortensias`).

Durante algumas iterações, a posição por baixo do coração mostrou por
engano o ramo de copo-de-leite repetido, e as tentativas de correção
trocaram a peça errada (primeiro a imagem do canto inferior direito,
depois a posição do ramo de cima). A versão atual bate com o
`mockup_link.svg` e com a foto de referência do Illustrator que o casal
enviou. **Antes de mexer outra vez nestes três, confirmar qual é qual com
uma captura de ecrã com o nome do ficheiro sobreposto a cada peça.**

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
badges ilustrados de "Confirmar Presença" / "A Nossa História". As duas
ligações que existem são elementos da própria colagem: o coração
"Detalhes" leva a `#local` e o losango azul "RSVP" leva a `#rsvp`. Já
não há atalho para "A Nossa História" (a faixa de texto que existia por
baixo da colagem foi removida a pedido do casal) — essa secção só se
alcança a fazer scroll.

## Se precisar de ajustar outra vez

Substituir o `.webp` mantendo as mesmas proporções; se mudarem, reajustar
as posições em `PIECES`, no topo de `page.tsx`. Se for preciso medir de
novo contra uma maquete nova, o mais fiável é sobrepor uma grelha de
percentagem à imagem (como se fez aqui) e comparar lado-a-lado com uma
captura de ecrã real do template — não estimar só pela descrição.

### Cuidado com `position:relative` a tapar conteúdo a seguir

O `<div>` da colagem tem `position:relative`, e um elemento posicionado
pinta sempre por cima de um irmão seguinte sem posição própria, seja qual
for a ordem no DOM. Foi assim que a antiga faixa de texto por baixo da
colagem ficou tapada pelo ramo final (corrigido na altura com
`relative z-20`; a faixa entretanto foi removida). Se voltar a pôr
qualquer coisa logo a seguir à colagem, dar-lhe também posição + z-index.
