@AGENTS.md

# Digital Invite Studio — guia rápido

Plataforma de convites digitais de casamento. Stack: **Next.js 16** (App Router, Turbopack), React 19, TypeScript, **Tailwind CSS v4**, **Supabase** (auth + DB + storage), Framer Motion. i18n PT/EN.

## Deploy (ler primeiro)
- **Produção = branch `main`** → publica em digitalinvitestudio.com via **Vercel** automaticamente.
- Branches de feature só geram deploy de *preview* (URL separado) — **não** mudam o site real.
- **Para pôr algo no ar: fazer merge do branch para `main` e push.** Mexer só no branch nunca altera a produção.
- O container é efémero: `node_modules` pode desaparecer → correr `npm install` se faltar.
- Env vars (Vercel/local): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Para testar `next build` localmente sem Supabase real, usar valores fictícios (senão dá "supabaseUrl is required").

## Fontes & marca
- Títulos (h1–h4, aplicado global em `app/globals.css`): **Cormorant Garamond** — `--font-cormorant` / classe `font-serif`.
- Corpo e UI: **Jost** — `--font-jost` / `font-sans`.
- Script decorativa: **Pinyon Script** — `--font-pinyon` / `font-script`.
- Nomes dos noivos (Save the Date): **Beloved** (paga) — `@font-face` em globals.css, `--font-beloved`, ficheiro `public/fonts/beloved_lovely-webfont.woff2`.
- Cores: bordô `#630100`, creme `#FDFBF7`, dourado `#B8945A` / `#EFDFBB`, tinta `#332E2B`.

## Onde está o quê
- Templates de convite: `app/[locale]/templates/<id>/page.tsx` (minimal-01, luxury-01, collage-01, noir-01). O `app/[locale]/invite/[slug]/page.tsx` escolhe o template por `template_id`.
- Dashboard do evento: `app/[locale]/dashboard/[slug]/page.tsx`. Tem um **hub** com 3 áreas (Convite de casamento / Convidados+Mesas / Momentos) que filtram separadores; os separadores usam módulos em `components/dashboard/*Module.tsx`.
- Lista de eventos: `app/[locale]/dashboard/page.tsx`.
- i18n: `dictionaries/pt.ts` e `en.ts` (~1135 linhas cada — **editar cirurgicamente com Edit, não ler na íntegra**).

## Base de dados
- **Alterações ao esquema vão para `supabase/migrations/`** (ver o LEIA-ME lá dentro), não para o painel do Supabase à mão. As tabelas antigas (invitations, guests, brands, etc.) são anteriores a esta regra e não têm ficheiro.
- Módulo Wedding Planner (B2B, em piloto): ligado por `brands.planner_plan`; lógica em `lib/planner.ts`; área "Gestão" no painel do evento (`BudgetModule`, `TasksModule`), só visível em contas de agência.

## Dados
- Coluna `content` (JSON) da tabela `invitations`: `{ sections_visibility: {...}, content: { <seccao>: {...} } }`. Nos módulos: `dbContent = formData.content`, `content = dbContent.content`. Guardar via `handleSaveDesign()` (faz update em `invitations`). Autosave: `useEffect` com debounce de 1500 ms sobre `formData`.
- Storage Supabase: bucket `invites` (imagens do convite/Save the Date), `fotos_evento` (galeria/guestbook).
- Nomes/data do evento vêm dos campos `bride_name`, `groom_name`, `event_date`.

## Convenções
- Geração de PDF/imagem no cliente: `jspdf` + `html2canvas` (já instalados).
- Ícones: `lucide-react` (imports nomeados PascalCase).
- Antes de publicar, validar com `npx tsc --noEmit` (rápido) e, se possível, `next build` com env vars fictícias.
