@AGENTS.md

# Digital Invite Studio — guia rápido

Plataforma de convites digitais de casamento. Stack: **Next.js 16** (App Router, Turbopack), React 19, TypeScript, **Tailwind CSS v4**, **Supabase** (auth + DB + storage), Framer Motion. i18n PT/EN.

**Mapa completo de funcionalidades, ecrãs, permissões e base de dados: `docs/MAPA-DO-PROJETO.md`** (ler antes de mexer em algo que não se conhece).

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
- Templates de convite: `app/[locale]/templates/<id>/page.tsx` (luxury-01, minimal-01, collage-01, classic-01, noir-01, arch-01, envelope-01). O `app/[locale]/invite/[slug]/page.tsx` escolhe o template por `template_id`. **Templates à medida** (ex.: `envelope-01-jose-e-dalia`): ligados no `invite/[slug]/page.tsx` mas **fora** de `AVAILABLE_TEMPLATES` (em `DesignModule.tsx`), por isso nenhum outro casal os vê; o `DesignModule` esconde o seletor no evento que usa um. Documentação do do José e da Dália: `public/envelope-01-jose-e-dalia/elementos/LEIA-ME.md`.
- Dashboard do evento: `app/[locale]/dashboard/[slug]/page.tsx`. Tem um **hub** (com a lista "O que falta fazer" no topo) com uma área por módulo vendável (Save the Date / Convite / Convidados+Mesas / Fotos / Livro de visitas) mais **Links e QR codes** (`LinksHub`), **Planeamento** (só contas de agência) e **Conta** (`GROUP_TABS`); as áreas filtram separadores, que usam módulos em `components/dashboard/*Module.tsx`.
- Lista de eventos: `app/[locale]/dashboard/page.tsx`.
- i18n: `dictionaries/pt.ts` e `en.ts` (~1135 linhas cada — **editar cirurgicamente com Edit, não ler na íntegra**).

## Base de dados
- **Alterações ao esquema vão para `supabase/migrations/`** (ver o LEIA-ME lá dentro), não para o painel do Supabase à mão. As tabelas antigas (invitations, guests, brands, etc.) são anteriores a esta regra e não têm ficheiro.
- Módulo Wedding Planner (B2B, em piloto): ligado por `brands.planner_plan`; lógica em `lib/planner.ts`; área "Gestão" no painel do evento (`BudgetModule`, `TasksModule`), só visível em contas de agência.

- Links personalizados por grupo de convidados (opcional): tabela `guest_links` (migração `0010`), `lib/guestLinks.ts`, rota `app/api/guest-link/[token]`, painel `GuestLinksPanel`, `GuestGreeting` no convite e `SmartRsvp` com `?c=`. Sem links, o convite e o RSVP funcionam como sempre.
- Código de acesso ao convite (opcional, desligado por omissão): migração `0011`, `lib/inviteAccess.ts` (cookie assinado + limites), rotas `app/api/invite-access` e `…/preview`, `InviteAccessGate` (ecrã de código, mostrado pelo `invite/[slug]/page.tsx`) e `InviteAccessCard` (painel, área Links). O código fica em `invite_access`, nunca em `invitations`.
- Centro de ajuda (`/help`, PT/EN): conteúdo em `content/help/pt.ts` e `en.ts` (não nos dicionários), `lib/help.ts`, `components/help/`. **Uma funcionalidade nova ou alterada pede o artigo correspondente nos dois idiomas** (mesmos `slug` e ordem; nomes de botões a **negrito**, iguais aos do painel). Artigos `audience: "dis"` não aparecem em domínios de parceiros.

## Dados
- Coluna `content` (JSON) da tabela `invitations`: `{ sections_visibility: {...}, content: { <seccao>: {...} } }`. Nos módulos: `dbContent = formData.content`, `content = dbContent.content`. Guardar via `handleSaveDesign()` (faz update em `invitations`). Autosave: `useEffect` com debounce de 1500 ms sobre `formData`.
- Storage Supabase: bucket `invites` (imagens do convite/Save the Date), `fotos_evento` (galeria/guestbook).
- Nomes/data do evento vêm dos campos `bride_name`, `groom_name`, `event_date`.

## Convenções
- Geração de PDF/imagem no cliente: `jspdf` + `html2canvas` (já instalados).
- Ícones: `lucide-react` (imports nomeados PascalCase).
- Antes de publicar, validar com `npx tsc --noEmit` (rápido) e, se possível, `next build` com env vars fictícias.
