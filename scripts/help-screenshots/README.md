# Capturas de ecrã do centro de ajuda

Gera `public/help/<idioma>/*.webp` a partir do painel **real**, com dados de
exemplo ("Joana e Rui"), em PT e EN. Os artigos usam-nas através do campo
`shots` em `content/help/pt.ts` e `en.ts`.

**Quando correr:** sempre que mudar o aspeto de um ecrã que tem captura (hub,
Convite, Convidados, Mesas, Links, Conta…). Se uma captura ficar desatualizada, o
artigo mostra um painel que já não existe.

## Como correr

Precisa de Playwright com Chromium (`npm i -D playwright && npx playwright install chromium`)
e do `sharp` (já está no projeto). Em três terminais, na raiz do projeto:

```bash
# 1. Supabase simulado com os dados de exemplo (porta 54321)
node scripts/help-screenshots/mock-supabase.cjs

# 2. A aplicação a apontar para o simulado (porta 3001)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon \
SUPABASE_SERVICE_ROLE_KEY=svc npx next dev -p 3001

# 3. Gerar (os dois idiomas, ou só um: `... generate.cjs pt`)
node scripts/help-screenshots/generate.cjs
```

Depois **abra as imagens e confirme-as** antes de fazer commit (cortes, texto
partido, dados que não deviam aparecer).

## O que é cada ficheiro

| Ficheiro | O que faz |
|---|---|
| `mock-supabase.cjs` | PostgREST mínimo em memória, com convidados, mesas, links e colaboradores de exemplo. **Não** é um servidor real. `GET /__seed` repõe os dados. |
| `generate.cjs` | Percorre o painel com o Playwright, tira as capturas e converte para WebP (1400 px de largura). |

## Detalhes que convém saber

- Os endereços visíveis (`localhost:3001`) são trocados por `https://digitalinvitestudio.com`
  só no texto; os QR codes continuam a apontar para o servidor de teste.
- As miniaturas dos modelos vêm do Unsplash; o script substitui-as por mosaicos neutros.
- A captura "Modelos e identidade" é recortada antes do campo da data (o campo de
  data nativo do Chromium sem interface não respeita o idioma).
- Para **acrescentar** uma captura: adicione o passo em `generate.cjs`, acrescente
  `shots: [{ file, alt }]` ao artigo nos dois idiomas e corra de novo. Depois corra `npx tsx scripts/check-help-content.ts`:
  verifica slugs, mapeamentos e imagens que faltam ou sobram.
