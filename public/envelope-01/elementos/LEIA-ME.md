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
