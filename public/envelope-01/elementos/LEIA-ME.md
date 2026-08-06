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

## Nota sobre o "buraco" da foto de capa parecer sair do envelope

Se em produção a foto de capa aparecer a sair para fora do bico do
envelope, o `envelope-aberto.webp` em disco já não tem esse problema —
verificado por medição direta do canal alfa (o buraco fica um pentágono
fechado, sem fuga até às bordas do ficheiro) e por captura de ecrã do
template a várias larguras, com a foto sempre contida dentro do bico. A
causa mais provável de continuar a ver o problema é o deploy da Vercel
não ter sido promovido a produção depois do último commit — ver a nota
sobre isso no `CLAUDE.md`.

## Fotos usadas nas 5 zonas da colagem

As 4 polaroides e o arco usam `photoAt(0)`, `photoAt(1)`, `photoAt(2)`,
`photoAt(3)` e `photoAt(4)` — cinco índices distintos da galeria do
casal (`content.gallery.images_urls`), para que as 5 zonas mostrem 5
fotos diferentes sempre que o casal tiver 5 ou mais fotos carregadas. Com
menos fotos, `photoAt` faz `% length`, por isso alguma zona repete até
haver fotos suficientes.
