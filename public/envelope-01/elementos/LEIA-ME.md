# Elementos do modelo "Envelope" (hero em colagem)

Os ficheiros aqui são os que o template usa. Chegaram como SVG (na prática,
imagens rasterizadas embrulhadas em tags SVG, ~15 MB no total) e foram
convertidos para WebP com transparência: **15 MB → 618 KB**, sem diferença
visível. Os originais continuam no Drive e no histórico do git.

| Ficheiro | Onde aparece |
|---|---|
| `envelope-aberto.webp` | Topo da colagem |
| `moldura-nomes.webp` | Nomes, data e local do casamento |
| `polaroid.webp` | Usado 3×, com fotos da galeria do casal |
| `badge-detalhes.webp` | Navegação → "Detalhes" |
| `bolo.webp` | Decorativo |
| `envelope-rsvp.webp` | Navegação → "Confirmar Presença" |
| `arco-historia.webp` | Navegação → "A Nossa História" |

## Zonas de foto

Medidas diretamente nos ficheiros e fixadas em
`app/[locale]/templates/envelope-01/page.tsx`:

- **Polaróide** — a área cinzenta: `left 6.8%, top 5.5%, 87.2% × 74.5%`
- **Arco** — inserida no corpo do arco: `left 28%, top 11%, 64% × 47%`

O corpo do arco começa a **21%** da largura do ficheiro (as flores ficam à
esquerda dele), por isso o texto é centrado nessa zona e não no elemento
inteiro — ver `ARCO_BODY_INSET`.

## Se precisar de trocar um elemento

Substituir o `.webp` mantendo **as mesmas proporções**; se as proporções
mudarem, é preciso reajustar as posições em `PIECES`, no topo do template.
Todas as posições estão em percentagem de uma tela de proporção fixa, por
isso a composição mantém-se idêntica em qualquer ecrã.
