# Mapa do projeto — Digital Invite Studio

Documento para quem se sente perdido no projeto: o que existe, para quem, onde
está no código e o que ainda está por arrumar. Foi feito a partir de um
levantamento do código em novembro de 2026; se algo aqui já não bater certo
com o código, **o código manda** — e este ficheiro deve ser corrigido (ver
"Como manter este documento" no fim).

Para regras de trabalho (deploy, migrações, fontes, convenções) ver
`CLAUDE.md`. Para a base de dados ver `supabase/migrations/LEIA-ME.md`.

---

## 1. Em 30 segundos

Plataforma de **convites digitais de casamento**, em PT e EN. Cada casamento é
um **evento** (uma linha da tabela `invitations`) com um site público
(`/invite/<slug>`) e um painel de gestão (`/dashboard/<slug>`).

O que o casal pode comprar são **5 módulos** (ver secção 5). Por cima disso há:

- uma **área de planeamento** só para agências de wedding planning (secção 6);
- uma camada **white-label**: marcas parceiras com o seu domínio, logo e preços
  (secção 9);
- uma **área de administração** só para a equipa da DIS (secção 7).

---

## 2. Quem usa e o que cada um vê

| Quem | Como é reconhecido | O que pode fazer |
|---|---|---|
| **Dono do evento** (casal) | `invitations.user_email` | Tudo no seu evento. |
| **Colaborador** | tabela `invitation_collaborators` (`editor` ou `viewer`) | Editar (`editor`) ou só ver (`viewer`). |
| **Equipa da agência/parceiro** | tabela `brand_members` da marca do evento (`admin` → "owner", resto → "editor") | Gerir os eventos da marca, incluindo o planeamento. |
| **Super admin** | tabela `super_admins` | Acesso total, mais as vistas de administração. |
| **Convidado** | sem conta | Só as páginas públicas (secção 4). |
| **Fornecedor** | sem conta, só um link com token | Só a página que a agência lhe partilhou. |

Quem pode **editar**: dono, `editor`, equipa da agência e super admin, e só
enquanto o evento não estiver expirado. O convite fica inacessível 60 dias
depois do evento (campo `invitations.expires_at`).

---

## 3. Mapa de ecrãs (rotas)

### Site de marketing (público)
`/` · `/features` · `/features/<slug>` · `/help` · `/help/<slug>` · `/pricing` · `/partners` · `/contact`
· `/login` · `/reset-password` · `/terms` · `/privacy` · `/cookies`

### Painel (precisa de login)
| Rota | O que é |
|---|---|
| `/dashboard` | Lista de eventos. Para agências e super admin, tem uma barra com as vistas extra (secções 6 e 7). |
| `/dashboard/new-invite` | Criar um evento novo. |
| `/dashboard/<slug>` | O painel de um evento (secção 4). |

### Páginas públicas de um evento
| Rota | Para quê |
|---|---|
| `/invite/<slug>` | **O convite.** Escolhe o modelo pelo `template_id`. Mostra um ecrã "expirado" ou "módulo indisponível" quando for o caso. |
| `/rsvp/<slug>` | Confirmação de presença isolada, pensada para o QR de um convite em papel. Só precisa do módulo Convidados, não do Convite. |
| `/seating/<slug>` | O convidado procura o seu nome e vê a mesa. |
| `/moments/<slug>` | Os convidados enviam fotos (por QR). |
| `/live-wall/<slug>` | Mural de fotos para projetar na festa. |
| `/guestbook/<slug>` | Livro de visitas. |
| `/fornecedor/<token>` | Portal de um fornecedor (só leitura). |
| `/moodboard/<token>` | Moodboard partilhado (ver e acrescentar imagens, não apagar). |
| `/preview/<modelo>` | Pré-visualização dos modelos (só existe para 5 deles). |

### API (`app/api`)
`checkout` (cria a sessão Stripe) · `stripe/webhook` (regista o pagamento e
desbloqueia módulos) · `contact` (formulário, envia email por Resend) ·
`admin/business-overview` · `moodboard/unfurl` (pré-visualização de links) ·
`moodboard/public/<token>` e `…/upload` (escrita no moodboard partilhado) ·
`guest-link/<token>` (links personalizados: GET devolve o grupo e regista a abertura, POST grava o RSVP) ·
`invite-access` (verifica o código de acesso ao convite) e `invite-access/preview` (dá o cookie de acesso a quem gere o evento).

---

## 4. O painel de um evento (`dashboard/[slug]`)

Duas camadas: **áreas** (uma por módulo vendável) e, dentro de cada uma, os
**separadores**. O código está em `app/[locale]/dashboard/[slug]/page.tsx`
(`GROUP_TABS`).

| Área | Separadores | Componente |
|---|---|---|
| Save the Date | Save the Date | `SaveTheDateModule` |
| Convite | Uma só entrada "Convite", com um seletor *Modelos e identidade / Conteúdo* por cima | `DesignModule` · `ContentModule` |
| Convidados e Mesas | Convidados · Mesas | `GuestsModule` · `SeatingModule` |
| Partilha de fotos | Fotos | `PhotoSharingModule` |
| Livro de visitas | Livro de visitas | `GuestbookModule` |
| Links e QR codes | Links | `LinksHub` |
| Planeamento *(só agências)* | Orçamento · Tarefas · Cronograma · Partilha · Inspiração | ver secção 6 |
| Conta | Minha conta | `AccountModule` |

Se o módulo não estiver comprado, o separador mostra `LockedModuleNotice` com
botão de compra direta (`lib/checkout.ts`). O `WelcomeTour` é o tour de
boas-vindas.

**No topo do hub** está a lista **"O que falta fazer"** (`SetupChecklist`):
nomes e data, foto de capa, textos, lista de convidados e link partilhado.
Cada passo é calculado a partir dos dados do evento (nada é guardado à parte,
exceto "link partilhado" e "esconder lista", no browser) e leva ao sítio certo.
Só aparece a quem pode editar e só com passos de módulos ativos. Quando está
tudo feito passa a um aviso que se pode esconder.

**Links e QR codes** (`LinksHub`): convite, RSVP, plano de mesas, galeria, live
wall e livro de visitas, cada um com copiar, abrir e QR em PNG/SVG. Os módulos
continuam a mostrar os seus QR; esta área é um atalho central. Os links de
fornecedor e moodboard têm token próprio e continuam em Planeamento › Partilha
(há um botão que leva até lá).

**Pré-visualização:** o telemóvel ao lado é um `iframe` do convite real. Depois
de cada gravação, o painel manda `dis-preview-refresh` e o convite
(`PreviewBridge`, em `components/site/`) refaz só os dados do servidor com
`router.refresh()`, sem recarregar — por isso o envelope fica aberto e o scroll
mantém-se. Só reage dentro de um iframe da mesma origem.

**Como o convite guarda os dados:** a coluna `invitations.content` (JSON) tem
`sections_visibility` (que secções estão visíveis) e `content.<secção>` (os
textos). Os módulos editam `formData` e gravam com `handleSaveDesign()`, com
gravação automática 1,5 s depois de parar de escrever.

---

## 5. Os 5 módulos vendáveis

Registo fixo em `lib/modules.ts`; preços e pacotes em `lib/pricing.ts`.

| Módulo (`id`) | Preço | O que faz |
|---|---|---|
| `save_the_date` | 15 € | Gera o cartão Save the Date a partir de modelos SVG (`lib/stdTemplates.ts`, `lib/svgTemplate.ts`), com a foto e os nomes do casal, para descarregar. |
| `invite` | 79 € | O site do casamento: escolha do modelo e da cor de destaque, e todos os textos (capa, contador, história, galeria, programa, local, detalhes, presentes, RSVP, rodapé), com interruptores para esconder secções. **Inclui sempre `guests_seating`** (o RSVP precisa da lista de convidados). |
| `guests_seating` | 39 € | Lista de convidados (grupos, restrições alimentares, estados), importação e exportação em Excel e PDF, estatísticas, QR do RSVP público e plano de mesas com arrastar e largar. |
| `photo_sharing` | 35 € | Convidados enviam fotos por QR (`/moments`) e há o mural `/live-wall`. |
| `guestbook` | 19 € | Livro de visitas (`/guestbook`). |

**Pacotes:** "convite" (Save the Date + Convite + Convidados, 75 €), "momentos"
(Fotos + Livro de visitas, 44 €) e "completo" (os 5, 119 €). **Cupões:** tabela
`coupons`, com a lógica toda em `lib/coupons.ts`.

---

## 6. Planeamento (só contas de agência)

Ligado por `brands.planner_plan`; lógica e limites em `lib/planner.ts`. Os
dados escrevem diretamente nas suas tabelas (não pelo `handleSaveDesign`).

| Separador / vista | Componente | O que faz |
|---|---|---|
| Orçamento | `BudgetModule`, `BudgetSummary` | Custos, escalões por adulto/criança/bebé, pagamentos, contratos, notas, documentos. |
| Tarefas | `TasksModule` | Checklist; as datas recalculam-se se a data do casamento mudar. |
| Cronograma | `TimelineModule` | Horário do dia; a agência pode esconder blocos (ex.: surpresas) do casal. |
| Partilha | `SharingModule` | Todos os links partilháveis: portal do fornecedor e moodboard. |
| Inspiração | `MoodboardModule` | Mural partilhado com o casal, por secções. |
| Vista "Tarefas" (na lista de eventos) | `AgencyOverviewView` | O que precisa de atenção esta semana, em todos os casamentos. |
| Vista "Fornecedores" (na lista de eventos) | `VendorsView` | Diretório de fornecedores da agência, com histórico de preços. |

Os links de fornecedor e do moodboard têm **token** e correm no servidor com a
chave de serviço (`lib/vendorPortal.ts`, `lib/moodboardShare.ts`); nunca
importar esses ficheiros num componente `"use client"`.

---

## 7. Administração (só super admin, no domínio da DIS)

Vistas da lista de eventos (`dashboard/page.tsx`, `viewMode`), reunidas no menu
**"Administração"** (`AdminMenu`). Agências, que só têm "Gestão", veem o botão
simples. Eventos, Tarefas e Fornecedores ficam como separadores à parte.

| Vista | Componente | O que faz |
|---|---|---|
| Gestão | `AdminManagementView` | Todos os eventos ativos, com marca, data e convidados. |
| Membros | `MembersManagementView` | Quem pertence a cada marca. |
| Marcas | `BrandsManagementView` | Criar e editar marcas parceiras. |
| Cupões | `CouponsManagementView` | Cupões de desconto. |
| Preços | `BrandPricingView` | Preços por marca (`brand_pricing_overrides`). |
| Negócio | `BusinessOverviewView` | Visão geral do negócio (`api/admin/business-overview`). |

---

## 8. Pagamentos

1. O casal clica "comprar" num módulo bloqueado ou num pacote (`lib/checkout.ts`).
2. `api/checkout` cria a sessão no Stripe, já com o cupão aplicado.
3. Quando o pagamento termina, `api/stripe/webhook` (evento
   `checkout.session.completed`) regista a linha em `payments` e acrescenta os
   módulos em `invitations.unlocked_modules`. É o **único** sítio que escreve
   `unlocked_modules`.

---

## 9. Marcas e white-label

- `lib/brands.ts` resolve a marca pelo domínio (ex.: `digital.amazingmoon.pt`)
  e junta as marcas definidas no código às da tabela `brands`.
- A marca dá logo, contacto e preços; o `EventBrandProvider` aplica-a ao
  convite.
- `brand_id` nos eventos é **texto sem chave estrangeira** de propósito, porque
  há marcas definidas só no código.

---

## 10. Modelos de convite

Escolha em `DesignModule` (lista `AVAILABLE_TEMPLATES`); o convite público
escolhe o modelo por `template_id` e, se não reconhecer, usa o Luxury.

| `template_id` | Nome no seletor | Cor de destaque editável | Pré-visualização |
|---|---|---|---|
| `luxury-01` | Classic Luxury | não | não |
| `minimal-01` | Modern Minimal | não | sim |
| `collage-01` | Editorial Collage | não | não |
| `classic-01` | Clássico | sim | sim |
| `noir-01` | Editorial Noir | sim | sim |
| `arch-01` | Romântico | sim | sim |
| `envelope-01` | Envelope (em construção) | não | sim |
| `envelope-01-jose-e-dalia` | *(fora do seletor de propósito)* | n/a | não |

**Modelos à medida:** um `template_id` que está ligado em
`app/[locale]/invite/[slug]/page.tsx` mas **não** está em `AVAILABLE_TEMPLATES`
fica invisível para os outros casais, e o `DesignModule` esconde o seletor no
evento que o usa. Foi assim que se fez o do José e da Dália (cópia do
`envelope-01`). A documentação dele está em
`public/envelope-01-jose-e-dalia/elementos/LEIA-ME.md` (elementos, posições
lidas do SVG, fontes, ecrã de entrada).

---

## 11. Base de dados (Supabase)

Esquema novo vai **sempre** para `supabase/migrations/` (0001–0009 aplicadas),
com RLS ativada; as tabelas antigas não têm ficheiro.

| Tema | Tabelas |
|---|---|
| Eventos e acesso | `invitations`, `invitation_collaborators`, `super_admins` |
| Convidados e mesas | `guests`, `event_tables`, `guest_links` |
| Acesso ao convite | `invite_access` (o código), `invite_access_attempts` (limite de tentativas), `invitations.access_code_enabled/_version` |
| Momentos | `fotos_evento`, `fotos_likes`, `guestbook` |
| Marcas e dinheiro | `brands`, `brand_members`, `brand_pricing_overrides`, `coupons`, `payments` |
| Planeamento | `event_costs`, `event_cost_payments`, `event_cost_notes`, `event_tasks`, `event_timeline`, `event_documents`, `agency_vendors` |
| Links com token | `vendor_portal_links`, `moodboard_share_links` |
| Moodboard | `event_moodboard_sections`, `event_moodboard_items` |

**Storage:** buckets `invites` (imagens do convite e do Save the Date) e
`fotos_evento` (galeria e fotos dos convidados).

**Dois clientes Supabase:** `lib/supabase.ts` (chave pública, browser) e
`lib/supabaseAdmin.ts` (chave de serviço, **só servidor**).

---

## 12. Onde está o quê no código

| Pasta | Conteúdo |
|---|---|
| `app/[locale]/…` | Todas as páginas (secção 3). `middleware.ts` trata do idioma: cookie, depois idioma do browser; PT se for português, senão EN. |
| `components/dashboard/` | Os módulos do painel (secções 4 a 7). |
| `components/invite/SmartRsvp.tsx` | O formulário de RSVP, **partilhado por todos os modelos**: pesquisa o nome, mostra o grupo, grava o estado. Com um link personalizado (`?c=`) abre direto no grupo e grava pelo servidor. |
| `components/site/` | Barra, rodapé, marca (`BrandProvider`), ecrã de expirado. |
| `content/help/`, `lib/help.ts`, `lib/helpContent.ts`, `components/help/`, `public/help/`, `scripts/help-screenshots/` | Centro de ajuda e as suas capturas (secção 15). |
| `lib/` | Regras de negócio: módulos, preços, cupões, planeamento, marcas, Stripe, PDF/QR. |
| `dictionaries/pt.ts`, `en.ts` | Textos traduzidos (~1500 linhas cada). Editar com cirurgia, não ler inteiros. |
| `public/<modelo>/` | Imagens dos modelos. |
| `supabase/migrations/` | Alterações ao esquema. |

---

## 13. Coisas que convém não esquecer

- **Produção = `main`.** Mexer só num ramo não altera o site real.
- Os textos novos devem ir para os dicionários PT e EN, não escritos à mão no componente.
- No **link geral**, o RSVP continua a ler a lista de convidados do evento com a
  chave pública (qualquer pessoa com o link pode, em teoria, ver os nomes).
  Nos **links personalizados** isso não acontece: o servidor só devolve o grupo
  do código. Resolver o geral implicava mover a pesquisa para o servidor.
- **Cinzel** não existe como fonte global: cada modelo que a usa carrega-a à
  parte. No modelo do José e da Dália todo o texto é Cinzel e só os títulos de
  exibição são Pinyon Script.

---

## 14. Estado: o que está por arrumar

**Links personalizados por convidado** (fases 1 e 2 feitas, opcionais): um link por
grupo (`guest_links`, migração `0010`), painel "Links personalizados" no topo de
Convidados (gerar, editar nome/lugares, copiar, novo link, remover, exportar CSV).
O link tem a forma `/<idioma>/invite/<slug>?c=<código>`; o convite mostra a
saudação (`GuestGreeting`, hoje só no modelo do José e da Dália) e o RSVP abre
direto no grupo. Sem links gerados, tudo funciona como antes. Regras: lugares =
adultos + crianças (sem bebés), com correção manual; nome automático pelos
primeiros nomes, editável; convidado sozinho → "um lugar para si".
**Quem já abriu (fase 3, feita):** `guest_links` guarda primeira/última abertura e contagem
(migração `0011`; sem IP nem dados do aparelho). O painel mostra a coluna "Visto", o
resumo "X de Y já abriram" e um filtro "só os que ainda não abriram". Uma abertura conta
quando o convite carrega já depois do código de acesso (se houver); abrir o link para
testar também conta. Por fazer: saudação nos restantes modelos (cada um tem aspeto próprio).

**Código de acesso ao convite** (opcional, desligado por omissão; área "Links e QR codes",
`InviteAccessCard`): 4 dígitos. `invitations.access_code_enabled/_version` não são secretos
(a página lê-os); o código fica em `invite_access`, só legível por quem edita o evento.
Sem o cookie de acesso, `invite/[slug]/page.tsx` mostra só `InviteAccessGate` (sem nomes,
data nem fotos) — o convite nem chega ao browser. Vale também para links personalizados.
Cookie assinado (HMAC com chave derivada da `SUPABASE_SERVICE_ROLE_KEY`), 30 dias, invalidado
ao mudar o código. Limite de tentativas falhadas: 5 por IP em 15 min e 100 por convite em 1 h
(`lib/inviteAccess.ts`). O painel recebe o cookie por `invite-access/preview` para a
pré-visualização e "Abrir convite" não pedirem código ao administrador.
**Limites conhecidos:** 4 dígitos servem para evitar acessos casuais (link reencaminhado,
pré-visualizações), não são uma palavra-passe. Só o convite pede código — RSVP em página
própria, mesas, galeria, live wall e livro de visitas continuam abertos. O convite lê os dados
com a chave pública do Supabase, por isso alguém técnico que fale diretamente com a API
contornaria o código; fechar isso exige mover a leitura dos convites para o servidor.

**Melhorias de organização sugeridas:**
Já feitas e em produção:
"Design" + "Conteúdo" num só "Convite", lista "O que falta fazer", área
"Links e QR codes" e menu "Administração".

Ainda por fazer:
1. Os separadores de planeamento (Orçamento, Tarefas, Cronograma, Partilha,
   Inspiração) estão em português diretamente no código, fora dos dicionários.

**Limpeza de código:**
- `components/dashboard/EventModule.tsx` não é usado em lado nenhum.
- Ficheiros muito grandes: `GuestsModule` (~985 linhas), `BudgetModule` (~886),
  `dashboard/[slug]/page.tsx` (~800).
- `luxury-01` e `collage-01` não têm rota de pré-visualização.
- O modelo `envelope-01` aparece aos casais como "em construção".

---

## 15. Centro de ajuda (`/help`)

Guias passo a passo para casais (e um capítulo para agências), em PT e EN, em
`/<idioma>/help` (índice com pesquisa) e `/<idioma>/help/<slug>` (artigo).
Ligado no menu, no rodapé, na página inicial do painel (cabeçalho e fundo), na
barra lateral do editor e no sitemap.

- **Conteúdo:** `content/help/pt.ts` e `en.ts` (tipos em `types.ts`), **fora dos
  dicionários** de propósito. Cada artigo tem `slug`, `chapter`, `title` (em forma
  de pergunta), `summary`, `steps`, `tips`, `faq`, `related`, e opcionalmente
  `popular` (aparece em "Comecem por aqui") e `audience`. Os **slugs e a ordem têm
  de ser iguais nos dois idiomas**. Nos textos, `**negrito**` marca nomes de
  botões e separadores, **exatamente como aparecem no painel**.
- **Audiência:** `dis` = só no domínio da DIS (preços e compras; um parceiro trata
  disso com o casal), `agency` = capítulo "Para agências" (visível a todos, com
  etiqueta). O filtro por marca está em `lib/help.ts` (`visibleArticles`).
- **Páginas:** servidor (`app/[locale]/help/…`), com `FAQPage` em JSON-LD por artigo;
  a pesquisa (`HelpBrowser`) corre no browser, sem servidor, ignora acentos.
- **Ajuda dentro do painel** (`HelpDrawer`): o botão **"Como funciona?"**, no
  cabeçalho do editor, abre numa gaveta o artigo do separador onde se está, sem
  sair do editor (Esc ou clique fora fecha; "Ver também" muda de artigo; link
  para a página completa). Também abrem a gaveta o **"Como fazer?"** de cada passo
  pendente de "O que falta fazer" e o aviso "Ainda não há convidados". Que artigo
  abre em cada sítio está em `TAB_HELP` e `CHECKLIST_HELP` (`lib/help.ts`); um
  separador novo no painel precisa de entrada ali.
- **Peso:** `lib/help.ts` **não pode importar o conteúdo** (`content/help`): os
  componentes de cliente levariam os textos dos dois idiomas. O servidor usa
  `lib/helpContent.ts`; a gaveta importa o conteúdo do idioma **só ao abrir**
  (cerca de 30 KB, num bloco à parte).
- **Capturas de ecrã:** `public/help/<idioma>/*.webp`, referidas por `shots` nos
  artigos e geradas por `scripts/help-screenshots` (ver o README lá). Têm de ser
  refeitas quando um ecrã mudar de aspeto. Coerência a verificar ao mexer no
  conteúdo: slugs e ordem iguais em PT e EN; todos os slugs de `TAB_HELP` /
  `CHECKLIST_HELP` e de `related` existem; cada imagem referida existe nos dois
  idiomas e nenhuma sobra. **Há um verificador:** `npx tsx scripts/check-help-content.ts`.
- **Por fazer:** "Isto ajudou?" em cada artigo; artigos novos à medida que as
  funcionalidades crescem.

---

## Como manter este documento

Atualizar quando mudar algo que estas secções descrevem: um módulo novo, uma
rota nova, uma tabela nova, um modelo novo. Um módulo novo toca em quatro
sítios (`lib/modules.ts`, `lib/pricing.ts`, `GROUP_TABS` no painel e a tabela
da secção 5) **e um artigo no centro de ajuda (`content/help`, PT e EN)**; um modelo novo em três (`app/[locale]/templates/<id>`, o ramo em
`invite/[slug]/page.tsx` e, se for público, `AVAILABLE_TEMPLATES`).
