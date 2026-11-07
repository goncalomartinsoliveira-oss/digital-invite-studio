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

Página inicial (`app/[locale]/page.tsx`, textos em `HomePage` nos dicionários): o **convite digital é o produto principal**. Ordem: hero com o convite → factos → coleção de modelos (lê `lib/templates.ts`, com lugares "Em breve") → dentro do convite → RSVP e painel → "a viagem" (os outros módulos, com ligação a `/features/<slug>`) → **convite à medida** (`#a-medida`, botão "Pedir proposta" → `/contact?assunto=medida`, que pré-seleciona "Pedido de Orçamento Personalizado") → como funciona → faixa de parceiros → FAQ → CTA. Sem preços (estão em `/pricing`) nem prazo de disponibilidade.

Parceiros (`/partners`, textos em `PartnersPage`): página de venda para wedding planners e agências — Planeamento com capturas reais (`public/partners/*.jpg`, geradas no simulador com a agência fictícia "Atelier Lua"), o que os noivos recebem, marca própria (Domínio Próprio / Parceiro Leve), planos mensais com preços (de `lib/planner.ts`, IVA incluído), FAQ e "Marcar uma demonstração" (`/contact?assunto=parceria`).

Funcionalidades (`/features`, textos em `DetailedFeaturesPage`): o convite em destaque, os outros quatro módulos "à volta do convite", "tudo ligado", convite à medida e CTA. Detalhe (`/features/<slug>`, textos em `FeatureDetailPage.modules`): passo a passo com imagens, secções (só convite), à medida (só convite), o que inclui, na prática. **As imagens estão listadas em `app/[locale]/features/images.ts`** (versões PT/EN que existem de cada ficheiro em `public/features/<slug>/`); uma imagem nova só aparece depois de entrar nessa lista. As do convite (`convite-de-casamento/`) são composições do Renaissance Blue e do editor.

O convite fica disponível até 60 dias depois do casamento (`expires_at`; decidido manter em nov. 2026).

### Painel (precisa de login)
| Rota | O que é |
|---|---|
| `/dashboard` | Lista de eventos, com separadores **Ativos** e **Arquivados** (no dia seguinte ao casamento o evento passa para Arquivados; `lib/eventArchive.ts`; a vista Gestão do super admin tem os mesmos separadores e mostra até quando cada arquivado fica online). Para agências e super admin, tem uma barra com as vistas extra (secções 6 e 7). |
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
| `/preview/<modelo>` | **Sala de demonstração** de um modelo (`app/[locale]/preview/[id]`, `components/site/PreviewShowroom.tsx`): no computador, o convite a funcionar dentro de um telemóvel (iframe de `/preview/<modelo>/convite`, escalado à altura do ecrã), com painel do modelo ("Experimente", **Usar este modelo**, **Quero um convite à medida**, QR code para abrir no telemóvel, outros modelos); no telemóvel, o convite em ecrã inteiro com barra em baixo e painel numa folha. Sem menu nem rodapé do site. Dados fictícios em `app/[locale]/preview/demos.tsx` (`TEMPLATE_DEMOS`); o id do evento é `preview` e o RSVP entra em **modo de demonstração** (`components/invite/demoGuests.ts`: Família Silva, Costa, Santos; nada é lido nem gravado na base de dados). Só existe para modelos de `lib/templates.ts` com entrada em `TEMPLATE_DEMOS`. |

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
| Conta | Minha conta | `AccountModule`: quatro blocos com âncoras — **O vosso plano** (publicado ou não, data de publicação e "online até", o que inclui, preço do servidor e **Publicar convite**; nos eventos pagos pelo parceiro, "incluído no serviço de …" e contacto do parceiro; para a equipa do parceiro, quem paga), **Pagamentos** (escondidos aos noivos quando paga o parceiro, para não mostrar o preço de parceiro; tentativas falhadas só para o super admin), **Equipa do evento** (dono + colaboradores; só quem edita convida ou remove) e **Os vossos dados** (e-mail da sessão, password, sair). Super admin: bloco extra **Módulos do Evento**. |

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

**Menu Wedding Planner** (lista de eventos, `AdminMenu` com `singleShowsMenuLabel`): "Esta
semana" e "Fornecedores". **Semáforo** (regras e limiares em `lib/plannerOverview.ts`):
vermelho = algo já falhou (tarefa/pagamento em atraso, orçamento > 100%, prazo do RSVP
passado com pendentes); amarelo = atenção em breve (orçamento ≥ 85%, RSVP a fechar com < 80%
de respostas, casamento a ≤ 30 dias com < 90%, pedidos de acesso, prazos a ≤ 7 dias). O
orçamento usa o mesmo cálculo do separador Orçamento (`budgetTotals`/`budgetHealth`). A data
limite do RSVP para os avisos é `content.rsvp.deadline_date` (campo de data no editor; o texto
do convite continua em `text_limit_date_fixed`). "Respostas nas últimas 24 h" precisa da
migração `0012` (`guests.responded_at`, preenchida por trigger).

**Reaproveitar o método da agência:** em Tarefas e em Orçamento, **Copiar de outro casamento**
(`CopyFromEventModal` + `lib/plannerCopy.ts`: só casamentos da mesma marca; tarefas voltam a "por
fazer" com os prazos recalculados para a data nova; custos voltam a "a orçar", sem pagamentos/notas/
documentos, e o fornecedor só se mantém na mesma marca). **Importar Excel** com modelo para
descarregar, na checklist e no diretório de Fornecedores (`PlannerExcelImport` + `lib/plannerImport.ts`:
cabeçalhos PT ou EN, linhas inválidas ignoradas com motivo, fornecedores repetidos ignorados).
Acrescentam sempre, nunca apagam.

**Lembrar quem falta** (cartão Links personalizados, `RemindPendingModal`): grupos com convidados
sem resposta, os que nunca abriram o link primeiro, com mensagem editável por grupo (nome, link
pessoal ou geral, prazo do RSVP) para copiar. Modelo da mensagem e "lembrado a" ficam no browser.

**Piloto Wedding Planner** (Administração › Visão geral, só super-admin no DIS, `PlannerPilotCard`): por
agência com plano — eventos, eventos com Planeamento, última atividade, itens criados ou alterados
nos últimos 7/30 dias, fornecedores; expande por evento. Usa `updated_at` (migração `0013`) e, sem ela,
só as datas de criação.

**Super admin:** vê sempre a área de Planeamento em qualquer evento (`showManagement`
= plano da marca **ou** super admin) e "Esta semana" na lista de eventos, com todos
os eventos que a vista de Gestão lhe mostra. "Fornecedores" continua a exigir
plano de agência, porque o diretório é por marca (no DIS ficaria vazio). A base de dados
já lhe dava acesso (`dis_is_super_admin()` em todas as políticas).

| Separador / vista | Componente | O que faz |
|---|---|---|
| Orçamento | `BudgetModule`, `BudgetSummary` | Custos, escalões por adulto/criança/bebé, pagamentos, contratos, notas, documentos. |
| Tarefas | `TasksModule` | Checklist; as datas recalculam-se se a data do casamento mudar. |
| Cronograma | `TimelineModule` | Horário do dia; a agência pode esconder blocos (ex.: surpresas) do casal. |
| Partilha | `SharingModule` | Todos os links partilháveis: portal do fornecedor e moodboard. |
| Inspiração | `MoodboardModule` | Mural partilhado com o casal, por secções. |
| Wedding Planner › **Esta semana** (lista de eventos) | `AgencyOverviewView` + `lib/plannerOverview.ts` | O ecrã de manhã: (1) um casamento por linha com semáforo e razões; (2) tarefas da agência e pagamentos a fornecedores, com "feita"/"pago" na própria lista (e "Anular") e ligação ao separador certo (`?tab=tasks|budget|guests`); (3) sinais dos convidados (RSVP a fechar, respostas nas últimas 24 h, links pessoais por abrir, pedidos de acesso); (4) à espera dos noivos (tarefas do casal em atraso ou a ≤ 14 dias). |
| Wedding Planner › **Fornecedores** (lista de eventos) | `VendorsView` | Diretório de fornecedores da agência, com histórico de preços. Só com plano de agência. |

Os links de fornecedor e do moodboard têm **token** e correm no servidor com a
chave de serviço (`lib/vendorPortal.ts`, `lib/moodboardShare.ts`); nunca
importar esses ficheiros num componente `"use client"`.

---

## 7. Administração (só super admin, no domínio da DIS)

Vistas da lista de eventos (`dashboard/page.tsx`, `viewMode`), reunidas no menu
**"Administração"** (`AdminMenu`), por ordem de uso. Agências só têm a tabela de
eventos e veem o botão simples "Gestão". Eventos, Parceiro e Wedding Planner ficam à parte.

| Vista | Componente | O que faz |
|---|---|---|
| Visão geral | `BusinessOverviewView` + `api/admin/business-overview` | Receita total e do mês, publicados (de quantos eventos), eventos novos no mês, parceiros ativos (com alguma funcionalidade ligada); **Para tratar** com atalhos (comissões aprovadas por pagar, parceiros sem NIF/IBAN com comissões, avisos de fim de prazo por enviar, conteúdo expirado por apagar → abre Todos os eventos › Arquivados); comissões por pagar; receita dos últimos 6 meses; receita por parceiro com as contas; Piloto Wedding Planner. |
| Todos os eventos | `AdminManagementView` | Todos os eventos, com pesquisa e filtros por parceiro e por publicado, em **Ativos** e **Arquivados**. Nos arquivados (só super admin): **Enviar aviso** (e-mail aos noivos com a data-limite e como descarregar fotos e mensagens; `api/admin/expiry-notice`, Resend, grava `expiry_notice_sent_at`) e, nos expirados, **Apagar conteúdo** (`api/admin/event-cleanup` + `lib/eventCleanup.ts`; confirmação com contagens e "APAGAR"; também em massa). A limpeza apaga Storage (`fotos_evento/<id>`, imagens do convite em `invites`), convidados, mesas, links por família, livro de visitas, gostos, código de acesso e o conteúdo do convite, e grava `content_purged_at`. **Nunca toca** no registo do evento, nos pagamentos, nem nos dados do Planeamento (orçamento, fornecedores, valores, tarefas, cronograma, documentos, moodboard), que a agência continua a ver. Migração `0014`. |
| Parceiros | `BrandsManagementView` | Lista (funcionalidades, eventos, receita, comissões por pagar) e ficha de cada parceiro: condições (`PartnerTermsCard`), **equipa do parceiro** (`BrandMembersPanel`, `brand_members`), logótipo e contacto. Inclui as marcas de código (ex.: Amazing Moon, `lib/brands.ts`): nome, logótipo, domínio e contacto vêm do código; ao ligar o Planeamento cria-se a linha delas em `brands` (onde vive `planner_plan`). Criar parceiro fica no fim. |
| Comissões | `CommissionsView` | Ver "Recomendações" em Pagamentos. |
| Cupões | `CouponsManagementView` | Cupões de desconto (promoções da DIS; os códigos de parceiro vivem na ficha do parceiro). |
| Equipa interna | `InternalTeamView` | Quem é super admin (`super_admins`). |

---

## 8. Pagamentos

**Preços (nov. 2026), todos em `lib/pricing.ts` com IVA incluído:**
- **Plano Completo** (`FULL_PLAN`, id `completo`): o único produto para casais.
  Desbloqueia todos os módulos com um pagamento único. Preço de lançamento
  119 € (`FULL_PLAN.priceCents`) com o normal, 149 € (`FULL_PLAN_LIST_PRICE_CENTS`),
  riscado; para acabar o lançamento basta igualar os dois valores.
- Quem já tinha módulos comprados à peça paga **só a diferença**
  (`fullPlanPriceFor`: preço do plano menos o valor do que já tem, nunca mais do
  que os módulos em falta valeriam). Se já pagou tanto ou mais do que o plano,
  o `api/checkout` desbloqueia o resto sem pagamento.
- **Convite à medida:** a partir de 699 € (`BESPOKE_FROM_CENTS`), sem checkout;
  "Pedir proposta" → `/contact?assunto=medida`.
- **Parceiros (nov. 2026, fase A):** um parceiro é uma marca (`brands`) com funcionalidades ligadas pelo super admin em Administração › **Parceiros** (`BrandsManagementView` + ficha `PartnerTermsCard`): **recomendação** (comissão e código, fase B), **preço de parceiro** (normal e de volume, a partir do N.º casamento pago pelo parceiro, contado desde sempre; por omissão 79 €/69 €/10), **Planeamento** (`brands.planner_plan`, sem mensalidade) e **marca própria**. As condições vivem em `partner_accounts` (migração `0015`; leitura só super admin e membros do parceiro, porque `brands` é pública). Nos eventos de parceiros, a equipa escolhe **quem paga** (`invitations.paid_by`): "a agência" (preço de parceiro; só a equipa do parceiro pode pagar) ou "os noivos" (preço normal). O preço é sempre calculado no servidor (`lib/partnerPricing.ts`, `api/checkout/quote`, `api/checkout`); os cupões não se somam ao preço de parceiro. A página `/partners` não mostra valores: "Pedir condições" abre o contacto com o tipo de parceria pré-preenchido. Os planos mensais (Solo/Profissional/Agência) e `brand_pricing_overrides` deixaram de ser usados.
- **Recomendações (fase B, `lib/referrals.ts`):** o link `/r/CODIGO` (rota `app/[locale]/r/[code]`) guarda o código num cookie (`dis_ref`, 90 dias); o dono do evento liga-o ao abrir o painel (`api/referral/attach`) e um código de parceiro escrito no campo do código promocional, ao pagar, ganha ao link e não dá desconto (`api/checkout`). Um link ou código nunca liga um evento ao próprio parceiro (marca do evento, ou dono membro do parceiro). Comissão: num evento de parceiro com "Quem paga" = os noivos, vai para esse parceiro; num evento direto, para quem o recomendou. O webhook do Stripe grava no pagamento `referral_brand_id`, `commission_pct`, `commission_cents` (sobre o valor sem IVA, 23%) e `commission_status` "pending", só quando pagam os noivos e o parceiro tem a recomendação ligada; um reembolso total cancela-a. O estado mostrado passa a "aprovada" 14 dias depois do pagamento; o super admin marca como "paga" em **Administração › Comissões** (`CommissionsView`, `api/admin/commissions`, também exporta CSV). Os membros de um parceiro com recomendação ou preço de parceiro ligados têm a área **Parceiro** na lista de eventos (`PartnerAreaView`, `api/partner/overview`): condições por extenso, link/código/QR, vendas sem nomes dos casais (RGPD), totais e os eventos que gerem. Condições do programa na secção 8 dos Termos.
- Os módulos continuam a existir por dentro (`unlocked_modules`), mas já não se
  vendem à peça; os pacotes antigos ("convite", "momentos") só aparecem em
  pagamentos e cupões antigos. Preços por parceiro (`brand_pricing_overrides`)
  continuam a funcionar sobre o plano.

**Quando se paga: "grátis para preparar, paga-se para publicar" (nov. 2026), sem prazo.**
- Antes de pagar, o painel está todo editável (`isTabLocked` devolve sempre
  `false`): convite, convidados, mesas, Save the Date, fotos e livro de visitas.
- O convite público só abre aos convidados depois de publicado (`invite` em
  `unlocked_modules`); até lá mostra "Este convite ainda não foi publicado".
  Quem gere o evento recebe um cookie de pré-visualização
  (`api/invite-access/preview`, `ownerPreviewCookieName`) e vê o convite com a
  faixa "Pré-visualização" e o RSVP inativo (`components/invite/InviteMode.tsx`).
- Save the Date com marca d'água (pré-visualização e PDF) até pagar.
- Fotos, Live Wall e livro de visitas em **modo de experiência**: no máximo
  5 fotos e 5 mensagens por evento (`lib/trial.ts`, verificado antes de cada
  envio através de `api/trial`). O painel mostra "Modo de experiência: X de 5".
- RSVP standalone (`/rsvp`) e plano de mesas público (`/seating`) só depois de
  publicar. Em **Links e QR codes** esses cartões dizem "Disponível depois de publicar".
- Botão **Publicar convite** (topo do painel, lista "O que falta fazer",
  cartão "Prontos para enviar?" no hub) = checkout do Plano Completo. Eventos de
  parceiros publicam pelo parceiro; o super admin em Conta › Módulos do Evento.

**Fluxo:**
1. O casal carrega em **Publicar convite** (topo do painel ou cartão no hub,
   `BundleOffers`), ou em **Ativar Plano Completo** nas fotos / livro de visitas /
   Save the Date, via `lib/checkout.ts`.
2. `api/checkout` calcula o preço (ou a diferença), cria a sessão no Stripe, já
   com o cupão aplicado.
3. Quando o pagamento termina, `api/stripe/webhook` (evento
   `checkout.session.completed`) regista a linha em `payments` e acrescenta os
   módulos em `invitations.unlocked_modules`. Fora isto, só escrevem
   `unlocked_modules` o super admin (Conta › Módulos do Evento) e o desbloqueio
   sem pagamento acima.

**Dados dos convidados (migração `0018`):** `guests` e `guestbook` só são
legíveis pela equipa do evento. O RSVP do link geral (`SmartRsvp`) usa
`api/rsvp` (pesquisa por nome devolve só id e nome, até 5; o grupo vem pelo id
de um convidado; as respostas só gravam um grupo; pedidos de quem não está na
lista ficam "requested"), com o convite publicado, dentro do prazo e, se houver
código de acesso, depois de o introduzir. "Encontre a sua mesa" usa
`api/seating` (pelo menos 2 letras; nome e mesa). Ajudas em `lib/publicGuests.ts`.

**Campos do conteúdo por modelo:** o editor mostra os campos do esquema do
modelo (`layout` em `lib/templates.ts`; esquemas em `lib/templateContent.ts`).
Hoje só a secção Capa (hero) depende do esquema: `classico` tem o Título
secundário; `envelope-colagem` (Renaissance Blue e futuros temas com a mesma
colagem) tem a frase do convite (até 3 linhas), a palavra em destaque, o
título do círculo "Save the Date" e título/subtítulo dos botões Detalhes e
RSVP. Os valores ficam em `content.hero.<campo>`; o template lê com
`contentText()`, e um campo vazio mostra o texto original do modelo.
Também "A Nossa História" segue o esquema: no `envelope-colagem` o título é um
só campo (`story.title`; eventos antigos com `title_our`/`title_history`
continuam a mostrá-los) e a foto redonda tem enquadramento
(`story.story_image_position`, moldura `CIRCLE_FRAME`).

**Enquadramento da foto de capa:** nos modelos com moldura (`COVER_FRAMES`
em `lib/coverFrame.ts`, hoje o Renaissance Blue), o editor de conteúdo mostra
**Enquadramento da foto** (`CoverFramer`): arrastar e zoom dentro da moldura,
gravado em `content.hero.main_image_position` e aplicado pelo template com
`coverImageStyle`. Uma foto nova volta ao centro.

**Eventos privados (migração `0020`):** a tabela `invitations` só é legível
pela equipa de cada evento (dono, colaboradores, agência, super admin). As
páginas públicas recebem só o que precisam: `/moments`, `/live-wall`,
`/guestbook`, `/rsvp` e `/seating` usam `api/public-event` (nomes, imagem de
perfil, marca, prazo, módulos); a página do convite lê com a chave de serviço e
entrega aos templates só `INVITE_PAGE_FIELDS` (`lib/publicEvent.ts`) — nunca o
e-mail dos noivos, orçamento, quem paga ou recomendação. As etiquetas de dieta
do RSVP vêm de `api/rsvp?tags=1`; a verificação de link ao criar evento de
`api/slug-available`.

**Fotos dos convidados (migração `0019`):** na galeria `/moments`, cada browser
tem uma chave secreta (`lib/uploaderKey.ts`, localStorage). O envio passa por
`api/photos` (`upload`: verifica prazo e limite de experiência, cria o caminho,
regista em `photo_uploads` o hash da chave e devolve um link de envio
temporário); `mine` lista as fotos deste browser; `delete` apaga uma só se o
hash bater certo. Na foto aberta aparece **Apagar** só nas próprias. A limpeza
de eventos expirados também apaga `photo_uploads`.

**Proteções na base de dados (migração `0016`):** o browser fala diretamente
com o Supabase, por isso as regras de pagamento também estão em triggers, que
valem para qualquer escrita: módulos ativos, datas de bloqueio/fim/limpeza,
recomendação, marca e dono de um evento só mudam pelo servidor (service_role)
ou por um super admin; "quem paga" só pela equipa do parceiro; pagamentos,
cupões, parceiros, condições, equipas e super admins só servidor / super admin;
colaboradores só por quem edita o evento; 5 fotos / 5 mensagens até pagar
(trigger em `guestbook`, política restritiva em `storage.objects`) e RSVP
público só com o convite publicado. Os triggers são SECURITY INVOKER para ver
o papel real de quem escreve; as contagens usam funções SECURITY DEFINER.

## 9. Marcas e white-label

- `lib/brands.ts` resolve a marca pelo domínio (ex.: `digital.amazingmoon.pt`)
  e junta as marcas definidas no código às da tabela `brands`.
- A marca dá logo, contacto e preços; o `EventBrandProvider` aplica-a ao
  convite.
- `brand_id` nos eventos é **texto sem chave estrangeira** de propósito, porque
  há marcas definidas só no código.

---

## 10. Modelos de convite

**Registo único: `lib/templates.ts`.** A montra da página inicial, o seletor do
editor (`DesignModule`) e a criação de um evento novo (`DEFAULT_TEMPLATE_ID`,
gravado em `dashboard/new-invite`) leem todos daqui. O ficheiro explica no topo
os 5 passos para pôr um modelo novo no ar. `COMING_SOON_SLOTS` mostra lugares
"Em breve" na montra e no seletor enquanto os próximos modelos não chegam (5 em
nov. 2026; baixar à medida que entram).

| `template_id` | Nome | Estado |
|---|---|---|
| `renaissance-blue-01` | Renaissance Blue | **único modelo público** (seletor, montra, `/preview/renaissance-blue-01`, modelo dos eventos novos) |
| `envelope-01-jose-e-dalia` | *(id antigo de Renaissance Blue, só no evento da Dália e do José)* | tratado como Renaissance Blue (`LEGACY_TEMPLATE_IDS`) |
| `luxury-01`, `minimal-01`, `collage-01`, `classic-01`, `noir-01`, `arch-01`, `envelope-01` | — | **retirados** (nov. 2026, `RETIRED_TEMPLATE_IDS`): fora do seletor, da montra e sem página de exemplo. O código em `app/[locale]/templates/` continua para os convites que já os usam não deixarem de abrir; esses eventos continuam a ver o seletor e podem mudar para o Renaissance Blue. **Não apagar:** a 5/11/2026 ainda havia eventos neles (`luxury-01` 20, `envelope-01` 2, `minimal-01` 1; ver com `select template_id, count(*) from invitations group by 1;`). Só quando a contagem destes ids chegar a zero. |

O convite público escolhe o modelo por `template_id`; sem id (eventos antigos,
de antes de `DEFAULT_TEMPLATE_ID`) ainda cai no Luxury.

**Renaissance Blue** (envelope azul com selo de cera, colagem de flores, Cinzel e
Pinyon Script) foi feito à medida do casamento da Dália e do José (cópia do
`envelope-01`) e passou a ser um modelo normal do seletor. O evento deles
ainda grava o id antigo `envelope-01-jose-e-dalia`: o convite público
(`invite/[slug]/page.tsx`) e o `DesignModule` (`LEGACY_TEMPLATE_IDS`)
tratam-no como o mesmo modelo, por isso não foi preciso mexer na base de dados. A
documentação (elementos, posições lidas do SVG, fontes, ecrã de entrada) está em
`public/renaissance-blue-01/elementos/LEIA-ME.md`. Está na montra da página inicial (`lib/templates.ts` + `public/home/tpl-<id>.jpg`, captura 480×984 do ecrã de entrada) com sala de demonstração em `/preview/renaissance-blue-01` (dados em `app/[locale]/preview/demos.tsx`); a página inicial usa ainda `public/home/rb-open.jpg` (convite aberto), `rb-scroll.webp` (convite inteiro, a deslizar no telemóvel) e `bespoke-*.webp` (colagem do convite à medida, a partir de `elementos/`). Suporta a saudação dos links
pessoais (`GuestGreeting`) e os textos são fixos em português, como nos outros modelos.
O convite é lido do evento, nada é específico do casal original.

**Modelos à medida:** um `template_id` que está ligado em
`app/[locale]/invite/[slug]/page.tsx` mas **não** está em `lib/templates.ts` (nem em `RETIRED_TEMPLATE_IDS`)
fica invisível para os outros casais, e o `DesignModule` esconde o seletor no
evento que o usa. É a receita para um próximo casal que peça um desenho próprio.

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
- **As letras do site são locais** (`lib/fonts`, `public/fonts`, aliases em `app/globals.css`): com `next/font/google` o build de produção no Vercel falhava de forma intermitente ("npm run build exited with 1", ~30 s, até em commits só de documentação) quando o pedido ao Google Fonts falhava; passava num Redeploy. Verificado: `next build` com a rede bloqueada compila. Detalhes e armadilhas em `lib/fonts/README.md`. (O `collage-01` ainda importa a *Lavishly Yours* do Google, mas no browser, em runtime — não afeta o build.)
- **Cinzel** não existe como fonte global: cada modelo que a usa carrega-a à
  parte. No Renaissance Blue todo o texto é Cinzel e só os títulos de
  exibição são Pinyon Script.

---

## 14. Estado: o que está por arrumar

**Links personalizados por convidado** (fases 1 e 2 feitas, opcionais): um link por
grupo (`guest_links`, migração `0010`), painel "Links personalizados" no topo de
Convidados (gerar, editar nome/lugares, copiar, novo link, remover, exportar CSV).
O link tem a forma `/<idioma>/invite/<slug>?c=<código>`; o convite mostra a
saudação (`GuestGreeting`, hoje só no Renaissance Blue) e o RSVP abre
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
- Os modelos retirados (secção 10) ainda têm código em `app/[locale]/templates/` e ainda há eventos neles (luxury-01 20, envelope-01 2, minimal-01 1, a 5/11/2026); apagar só quando a contagem chegar a zero.

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
da secção 5) **e um artigo no centro de ajuda (`content/help`, PT e EN)**; um modelo novo segue os 5 passos no topo de `lib/templates.ts`.
