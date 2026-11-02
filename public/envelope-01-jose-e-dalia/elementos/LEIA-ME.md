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
| `bouquet-calla.webp` | Decorativo |
| `forma-circulo.webp` | Decorativo (mancha de cor) |
| `coracao-renda.webp` | Decorativo |
| `pandeiro.webp` | Decorativo |
| `hortensias.webp` | Decorativo |
| `etiqueta-detalhes.webp` | Navegação → "Local" |

## Posições

Medidas sobre a maquete completa que o casal enviou ("template completo sem
texto", 748 × 2000 px — dá a proporção de `CANVAS_H` em
`envelope-01-jose-e-dalia/page.tsx`): grelha de 5% sobreposta à imagem,
afinadas por comparação direta lado-a-lado entre a maquete e a renderização
real do template (não só a olho — ver histórico da conversa para o processo
de várias iterações). Tal como no "envelope-01" original, tudo em `PIECES`
é percentagem da tela, por isso a composição escala por igual em qualquer
largura de ecrã.

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
