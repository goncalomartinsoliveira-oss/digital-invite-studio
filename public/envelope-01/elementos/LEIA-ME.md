# Elementos do modelo "Envelope" (hero em colagem)

Os ficheiros aqui são os que o template usa. Chegaram como SVG (na prática,
imagens rasterizadas embrulhadas em tags SVG, ~15 MB no total) e foram
convertidos para WebP com transparência: **15 MB → 618 KB**, sem diferença
visível. Os originais continuam no Drive e no histórico do git.

| Ficheiro | Onde aparece |
|---|---|
| `envelope-aberto.webp` | Topo da colagem |
| `moldura-nomes.webp` | Nomes, data e local do casamento |
| `polaroid.webp` | Usado 4×, com fotos da galeria do casal |
| `badge-detalhes.webp` | Navegação → "Detalhes" |
| `bolo.webp` | Decorativo |
| `envelope-rsvp.webp` | Navegação → "Confirmar Presença" |
| `arco-historia.webp` | Navegação → "A Nossa História" |

## Zonas de foto

Medidas diretamente nos ficheiros e fixadas em
`app/[locale]/templates/envelope-01/page.tsx`:

- **Polaróide** — a área cinzenta: `left 6.63%, top 5.5%, 87.43% × 72.92%`
- **Arco** — derivada da maquete: `left 46.2%, top 54.9%, 28.4% × 21.1%`
- **Envelope aberto** (forro = foto de capa, `hero.main_image_url`) —
  `left 5.62%, top 5.42%, 88.75% × 65.42%`. Ao contrário das outras, esta
  não foi medida por cor: o ficheiro original tinha uma camada com
  `id="fotografia"` a marcar exatamente essa forma (um pentágono, não um
  retângulo). Renderizou-se essa camada isolada para obter uma máscara,
  usou-se a máscara para abrir um buraco transparente no `envelope-aberto`
  (em vez do preenchimento verde original), e a foto entra por baixo desse
  buraco — fica recortada na forma exata do forro, vinco central incluído,
  sem precisar de `clip-path` nenhum em CSS.

O corpo do arco começa a **21%** da largura do ficheiro (as flores ficam à
esquerda dele), por isso o texto é centrado nessa zona e não no elemento
inteiro — ver `ARCO_BODY_INSET`.

## Como as posições foram obtidas

Não foram estimadas a olho. Os marcadores de foto (as zonas cinzentas nos
ficheiros, a preto na maquete) servem de âncoras: mediu-se a caixa de cada
marcador na maquete, e daí calculou-se para trás a posição e o tamanho do
elemento que o contém, compensando a rotação de cada polaróide.

Verificação: com as fotos escondidas, os marcadores do que está construído
caem a **menos de 1 pixel** dos da maquete (numa largura de 240 px):

| Elemento | Maquete | Construído |
|---|---|---|
| Forro do envelope | x47-133 y16-93 | x46-132 y15-93 |
| Polaróide A | x51-98 y136-183 | x50-98 y136-182 |
| Polaróide B | x138-189 y316-367 | x138-188 y316-366 |
| Polaróide C | x50-100 y356-405 | x50-100 y355-404 |
| Polaróide D | x56-107 y416-467 | x56-107 y416-466 |

O crachá, o bolo e o envelope creme não têm marcador interno; foram
posicionados por correspondência de imagem contra a maquete.

## ⚠️ Ao converter os SVG: dimensionar a janela ao ficheiro

Estes SVG declaram a sua própria largura/altura, e várias passam de
1400 px. Renderizar numa janela mais pequena **corta o desenho em
silêncio** — foi o que aconteceu numa primeira conversão, com uma janela
de 1400×1400:

| Ficheiro | Tamanho natural | O que se perdeu |
|---|---|---|
| `moldura-nomes` | 854 × 1475 | 75 px em baixo (o fundo do oval) |
| `badge-detalhes` | 1469 × 1412 | 69 px à direita (a pétala direita) |
| `arco-historia` | 1095 × 1429 | 29 px em baixo |
| `envelope-rsvp` | 1414 × 1009 | 14 px à direita |
| `bolo` | 1233 × 1409 | 9 px em baixo |

Ler sempre `width`/`height` do SVG e abrir a janela com folga sobre esse
valor. Para confirmar que nada ficou cortado: medir a percentagem de
píxeis opacos em cada borda do ficheiro convertido — num recorte correto
dá 0%, exceto em formas genuinamente retangulares (a polaróide e o
envelope aberto, que encostam mesmo às bordas).

## Se precisar de trocar um elemento

Substituir o `.webp` mantendo **as mesmas proporções**; se as proporções
mudarem, é preciso reajustar as posições em `PIECES`, no topo do template.
Todas as posições estão em percentagem de uma tela de proporção fixa, por
isso a composição mantém-se idêntica em qualquer ecrã.

## A foto de capa saía do bico do envelope — causa real

A primeira tentativa posicionava a foto num **retângulo** (`ENVELOPE_PHOTO`)
que envolvia a área da foto, medido a partir do canto-a-canto do buraco. O
problema: o buraco é um pentágono, não um retângulo, e os **cantos** desse
retângulo caem fora do contorno do envelope perto do bico (nomeadamente
perto do vértice de cima) — nessa zona não há nenhuma arte por cima a tapar
a foto, porque ali já é o fundo transparente da página, não o desenho do
envelope. Daí a foto "vazar" para cima do bico.

Correção: em vez de um retângulo aproximado, o `ENVELOPE_PHOTO_CLIP` usa a
forma exata da camada `id="fotografia"` do SVG original — as coordenadas do
próprio `path` (lidas do ficheiro fonte, recuperado do histórico do git)
convertidas em percentagem do viewBox e aplicadas como `clip-path: polygon(...)`
na foto. A foto passa a preencher a peça toda (0/0/100%/100%, tal como o
`envelope-aberto.webp`) e é a forma do `clip-path` que a recorta ao
pentágono exato — já não depende de nenhuma caixa aproximada nem da forma
como o buraco foi "furado" no ficheiro convertido. Verificado por captura
de ecrã em várias larguras (375px a 1300px): a foto encosta exatamente ao
contorno do envelope, sem vazar em nenhum canto.

Se o `envelope-aberto.webp` for alguma vez substituído por um redesenho,
este `clip-path` tem de ser recalculado a partir do novo `path
id="fotografia"` do ficheiro fonte — não copiar às cegas.

## Texto da moldura dos nomes

- **Intro** (`"O NOSSO CASAMENTO"`) usa `content.hero.text_above_names` —
  o mesmo campo editável no painel em Conteúdo do convite → Capa (Hero) →
  "Título secundário". Note que esse campo é **só** usado aqui; o texto
  do ecrã de entrada ("Recebeu um convite de") é fixo de propósito, tem
  um papel diferente (é a legenda do envelope fechado, não um título do
  casal) e não deve reutilizar o mesmo campo.
- As três zonas (intro, nomes, data+local) ficam centradas — via `top` +
  `translateY(-50%)` — a **43% / 59% / 79%** da altura do cartão. Isto
  não foi acertado a olho: o casal enviou `elementos/"exemplo de
  posicionamentos.svg"`, uma cópia do `moldura-nomes` com 3 camadas de
  texto de exemplo (`"O NOSSO CASAMENTO"`, `"NOME NOIVOS"`, `"DATA
  CASAMENTO"`) marcando o centro exato de cada zona. Esse ficheiro usa
  `writing-mode:tb-rl` com `transform="rotate(-90)"` (texto vertical
  rodado), por isso as coordenadas não se leem à letra — converteram-se
  para o sistema normal (`(x,y) local → (y, -x) na página`, pela matriz
  do `rotate(-90)`) e confirmaram-se por medição de pixel numa
  renderização à parte do próprio SVG. As duas contas bateram a menos de
  meio ponto percentual uma da outra.
  Se as posições precisarem de ajuste outra vez, o mais fiável é pedir
  um novo `exemplo de posicionamentos.svg` (ou equivalente) em vez de
  tentar adivinhar por descrição — foi assim que se chegou a estes
  números com confiança.
- O "&" da Pinyon Script tem uma laçada alta que a entrelinha apertada
  corta; tanto aqui como no ecrã de entrada usa-se `lineHeight` folgado
  (1.35–1.6) e `paddingBlock` para dar espaço de sobra ao glifo.

## Fotos usadas nas 5 zonas da colagem

As 4 polaroides e o arco usam `photoAt(0)`, `photoAt(1)`, `photoAt(2)`,
`photoAt(3)` e `photoAt(4)` — cinco índices distintos da galeria do
casal (`content.gallery.images_urls`), para que as 5 zonas mostrem 5
fotos diferentes sempre que o casal tiver 5 ou mais fotos carregadas. Com
menos fotos, `photoAt` faz `% length`, por isso alguma zona repete até
haver fotos suficientes.
