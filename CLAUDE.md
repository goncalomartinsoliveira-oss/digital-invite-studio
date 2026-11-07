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
- **As letras são locais** (`lib/fonts/*.ts` + `public/fonts/*.woff2`), **não** `next/font/google`: o build do Vercel falhava de forma intermitente quando o pedido ao Google Fonts falhava. Não reintroduzir `next/font/google`; ver `lib/fonts/README.md` (preload, aliases dos SVG do Save the Date, nomes dos exports).
- Títulos (h1–h4, aplicado global em `app/globals.css`): **Cormorant Garamond** — `--font-cormorant` / classe `font-serif`.
- Corpo e UI: **Jost** — `--font-jost` / `font-sans`.
- Script decorativa: **Pinyon Script** — `--font-pinyon` / `font-script`.
- Nomes dos noivos (Save the Date): **Beloved** (paga) — `@font-face` em globals.css, `--font-beloved`, ficheiro `public/fonts/beloved_lovely-webfont.woff2`.
- Cores: bordô `#630100`, creme `#FDFBF7`, dourado `#B8945A` / `#EFDFBB`, tinta `#332E2B`.

## Onde está o quê
- Templates de convite: **registo único em `lib/templates.ts`** (montra da home, seletor do `DesignModule`, modelo dos eventos novos; tem no topo os passos para pôr um modelo novo no ar e `COMING_SOON_SLOTS` para os lugares "Em breve"). Hoje o único modelo público é o **renaissance-blue-01**; os antigos (luxury-01, minimal-01, collage-01, classic-01, noir-01, arch-01, envelope-01) foram retirados (`RETIRED_TEMPLATE_IDS`), mas o código em `app/[locale]/templates/<id>/page.tsx` fica até se confirmar que nenhum evento os usa. O `app/[locale]/invite/[slug]/page.tsx` escolhe o template por `template_id`. Sala de demonstração de cada modelo: `/preview/<id>` (`PreviewShowroom`, dados fictícios em `app/[locale]/preview/demos.tsx`; o RSVP com id `preview` usa `components/invite/demoGuests.ts` e não toca na base de dados). **Renaissance Blue** nasceu como template à medida (casamento da Dália e do José) e é agora um modelo normal do seletor; o evento deles ainda grava o id antigo `envelope-01-jose-e-dalia`, que o `invite/[slug]/page.tsx` e o `DesignModule` (`LEGACY_TEMPLATE_IDS`, em `lib/templates.ts`) tratam como o mesmo modelo. Documentação e elementos: `public/renaissance-blue-01/elementos/LEIA-ME.md`. **Templates à medida** (um id ligado no `invite/[slug]/page.tsx` mas **fora** de `lib/templates.ts`) continuam a ser possíveis: nenhum outro casal os vê e o `DesignModule` esconde o seletor no evento que usa um.
- Dashboard do evento: `app/[locale]/dashboard/[slug]/page.tsx`. Tem um **hub** (com a lista "O que falta fazer" no topo) com uma área por módulo vendável (Save the Date / Convite / Convidados+Mesas / Fotos / Livro de visitas) mais **Links e QR codes** (`LinksHub`), **Planeamento** (contas de agência e super admins) e **Conta** (`GROUP_TABS`); as áreas filtram separadores, que usam módulos em `components/dashboard/*Module.tsx`.
- Lista de eventos: `app/[locale]/dashboard/page.tsx`.
- i18n: `dictionaries/pt.ts` e `en.ts` (~1135 linhas cada — **editar cirurgicamente com Edit, não ler na íntegra**).

## Base de dados
- **Alterações ao esquema vão para `supabase/migrations/`** (ver o LEIA-ME lá dentro), não para o painel do Supabase à mão. As tabelas antigas (invitations, guests, brands, etc.) são anteriores a esta regra e não têm ficheiro.
- Módulo Wedding Planner (B2B, em piloto): ligado por `brands.planner_plan`; lógica em `lib/planner.ts`; área "Gestão" no painel do evento (`BudgetModule`, `TasksModule`), só visível em contas de agência.

- Links personalizados por grupo de convidados (opcional): tabela `guest_links` (migração `0010`), `lib/guestLinks.ts`, rota `app/api/guest-link/[token]`, painel `GuestLinksPanel`, `GuestGreeting` no convite e `SmartRsvp` com `?c=`. Sem links, o convite e o RSVP funcionam como sempre.
- Código de acesso ao convite (opcional, desligado por omissão): migração `0011`, `lib/inviteAccess.ts` (cookie assinado + limites), rotas `app/api/invite-access` e `…/preview`, `InviteAccessGate` (ecrã de código, mostrado pelo `invite/[slug]/page.tsx`) e `InviteAccessCard` (painel, área Links). O código fica em `invite_access`, nunca em `invitations`.
- Centro de ajuda (`/help`, PT/EN): conteúdo em `content/help/pt.ts` e `en.ts` (não nos dicionários), `lib/help.ts`, `components/help/`. **Uma funcionalidade nova ou alterada pede o artigo correspondente nos dois idiomas** (mesmos `slug` e ordem; nomes de botões a **negrito**, iguais aos do painel). Artigos `audience: "dis"` não aparecem em domínios de parceiros.
  Ajuda no painel: botão "Como funciona?" + gaveta (`HelpDrawer`); um separador novo precisa de entrada em `TAB_HELP` (`lib/help.ts`). `lib/help.ts` **não importa** `content/help` (pesa no bundle de cliente; usar `lib/helpContent.ts` no servidor). As capturas em `public/help/` são geradas por `scripts/help-screenshots` (ver o README) e devem ser refeitas quando um ecrã mudar. Depois de mexer na ajuda: `npx tsx scripts/check-help-content.ts`.

## Dados
- Coluna `content` (JSON) da tabela `invitations`: `{ sections_visibility: {...}, content: { <seccao>: {...} } }`. Nos módulos: `dbContent = formData.content`, `content = dbContent.content`. Guardar via `handleSaveDesign()` (faz update em `invitations`). Autosave: `useEffect` com debounce de 1500 ms sobre `formData`.
- **Colunas geridas fora dos editores** (`unlocked_modules`, `date_locked_at`: Conta › Módulos do Evento e webhook do Stripe): o `handleSaveDesign()` **não** as grava (senão o autosave, a partir de uma cópia local desatualizada, desfazia ativações). Quem as altera avisa o painel (`onModulesChange` do `AccountModule`). Nova coluna assim → excluí-la também no `handleSaveDesign`.
- **Proteções na base de dados (migração `0016`):** triggers recusam que noivos ou parceiros mudem módulos ativos, datas de bloqueio/fim/limpeza, recomendação, marca ou dono de um evento, ou escrevam em `payments`, `coupons`, `brands`, `brand_members`, `super_admins`, `partner_accounts` — só o servidor (service_role) ou um super admin. Limite de experiência (5 fotos / 5 mensagens) e RSVP só com o convite publicado também impostos na BD. Uma escrita nova a estes campos tem de passar por uma rota do servidor com `supabaseAdmin`; o `handleSaveDesign` não pode reenviar campos protegidos (já exclui `expires_at` e `brand_id`).
- **Dados dos convidados são privados (migração `0018`):** `guests` e `guestbook` só são lidos pela equipa do evento. Páginas públicas nunca leem estas tabelas com a chave pública: o RSVP usa `api/rsvp` (pesquisa devolve só id+nome; grava só um grupo), a página das mesas `api/seating`, os links pessoais `api/guest-link` (ajudas em `lib/publicGuests.ts`).
- **Fotos dos convidados (migração `0019`):** a galeria `/moments` envia as fotos por `api/photos` (link de envio temporário; o servidor regista em `photo_uploads` o hash da chave do browser, `lib/uploaderKey.ts`) e o convidado pode **apagar só as que enviou**, do mesmo browser. Como o envio por link temporário não passa pelas regras do Storage, o limite de experiência e o prazo são verificados na rota. Sem a 0019, a página envia como antes.
- **Quando se paga:** grátis para preparar, paga-se para publicar (sem prazo). Antes do Plano Completo o painel está todo editável; o convite público só abre a quem gere o evento (cookie de pré-visualização, faixa "Pré-visualização", RSVP inativo — `InviteMode`); Save the Date com marca d'água; fotos e livro de visitas com limite de 5 cada (`lib/trial.ts`, `api/trial`). O botão **Publicar convite** é o checkout. Ver `docs/MAPA-DO-PROJETO.md` › Pagamentos.
- **Fim de prazo e limpeza:** um evento arquiva no dia seguinte ao casamento (`lib/eventArchive.ts`) e fica online até `expires_at` (60 dias). Depois, o super admin pode apagar o conteúdo em Gestão › Arquivados (`lib/eventCleanup.ts`, `api/admin/event-cleanup`; aviso por e-mail em `api/admin/expiry-notice`; migração `0014`). A limpeza **não** apaga o registo do evento, os pagamentos nem os dados do Planeamento; uma tabela nova com dados pessoais dos convidados tem de entrar em `runEventCleanup`.
- Storage Supabase: bucket `invites` (imagens do convite/Save the Date), `fotos_evento` (galeria/guestbook).
- Nomes/data do evento vêm dos campos `bride_name`, `groom_name`, `event_date`.

## Convenções
- Geração de PDF/imagem no cliente: `jspdf` + `html2canvas` (já instalados).
- Ícones: `lucide-react` (imports nomeados PascalCase).
- Antes de publicar, validar com `npx tsc --noEmit` (rápido) e, se possível, `next build` com env vars fictícias.
