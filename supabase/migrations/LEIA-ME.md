# Migrações do Supabase

Até agosto de 2026 o esquema da base de dados foi sempre criado à mão no painel
do Supabase, sem histórico nenhum no repositório. Isso passou enquanto as
tabelas eram só de convites; deixou de passar quando entraram dados financeiros
de agências, com políticas de acesso finas onde um erro expõe números que não
devem sair da agência.

A partir daqui, **qualquer alteração ao esquema fica num ficheiro destes**.

## Como correr

1. Supabase → **SQL Editor** → **New query**
2. Colar o conteúdo do ficheiro
3. **Run**

Os ficheiros são escritos para poderem ser corridos mais do que uma vez sem
estragar nada (`if not exists`, `create or replace`, `drop policy if exists`).
Se houver dúvida se um já foi aplicado, corra outra vez.

## Ordem

Correr por ordem numérica. Cada ficheiro assume que os anteriores já foram
aplicados.

| Ficheiro | O que faz | Aplicado |
|---|---|---|
| `0001_planner_module.sql` | Módulo Wedding Planner — fase 0: `brands.planner_plan`, `agency_vendors`, `event_costs`, `event_cost_payments`, `event_tasks`, funções auxiliares e RLS | ☑ |
| `0002_task_priority_vendor_status.sql` | `event_tasks.priority`, `event_costs.status` (estado do contrato), `event_cost_notes` (histórico de reuniões por fornecedor) | ☑ |
| `0003_documents.sql` | `event_documents` — documentos/contratos por evento, opcionalmente ligados a uma linha de custo | ☑ |
| `0004_event_timeline.sql` | `event_timeline` — cronograma do dia, partilhado com o casal por omissão (ao contrário das restantes tabelas do módulo) | ☑ |
| `0005_vendor_portal.sql` | `vendor_portal_links` — link de leitura sem conta para fornecedores, por evento + tipo ("timeline" / "full"), reutilizável por vários fornecedores. Sem política de leitura pública de propósito: a página lê com a service_role key, nunca com a anon key | ☑ |
| `0006_moodboard.sql` | `event_moodboard_sections` + `event_moodboard_items` — moodboard do evento organizado em secções (imagens carregadas ou links com miniatura extraída), sempre partilhado entre agência e casal, sem distinção agency/shared | ☑ |
| `0007_moodboard_share.sql` | `moodboard_share_links` — link de partilha do Moodboard (ver + contribuir), sem conta DIS, um por evento. Sem política de leitura/escrita pública: as rotas em `app/api/moodboard/public` usam a service_role key | ☑ |
| `0008_budget_total.sql` | `invitations.planner_budget_total_cents` — orçamento total por evento (um número, em vez da soma de `event_costs.budgeted_cents`). Faz backfill da soma antiga; a coluna antiga fica na BD sem uso | ☑ |
| `0009_cost_tiers_and_task_responsible.sql` | `event_costs` — preço por escalão etário (adulto/criança/bebé) e mínimo contratual com preço de excedente, mutuamente exclusivos. `event_tasks.responsible` (agência/noivos/conjunta), com constraint a impor que tarefa não-agência é sempre partilhada | ☑ |
| `0010_guest_links.sql` | `guest_links` — link personalizado por grupo de convidados (opcional): token por `group_id`, nome e lugares calculados ao vivo, com correções manuais opcionais. Sem política pública: `app/api/guest-link` usa a service_role key e só devolve o grupo do token | ☑ |
| `0011_invite_access_and_opens.sql` | Código de acesso ao convite (opcional, desligado por omissão): `invitations.access_code_enabled/_version` (não secretos), `invite_access` (o código, só legível por quem gere o evento) e `invite_access_attempts` (limite de tentativas, só servidor). Mais `guest_links.first_opened_at/last_opened_at/open_count` para ver que grupos já abriram o convite | ☑ |
| `0012_guest_responded_at.sql` | `guests.responded_at` + trigger que a preenche quando o estado passa a confirmado/recusado (qualquer caminho). Alimenta "respostas novas nas últimas 24 h" em Wedding Planner › Esta semana; sem ela, esse sinal não aparece | ☑ |
| `0013_planner_updated_at.sql` | `updated_at` + trigger nas tabelas do Planeamento (tarefas, custos, pagamentos, notas, documentos, cronograma, moodboard, fornecedores). Alimenta o cartão "Piloto Wedding Planner" (última atividade real de cada agência); sem ela o cartão usa só as datas de criação | ☑ |
| `0014_event_cleanup.sql` | `invitations.content_purged_at` (quando o super admin apagou o conteúdo de um evento expirado) e `invitations.expiry_notice_sent_at` (quando foi enviado o e-mail de aviso de fim de prazo). Usadas em Administração › Gestão › Arquivados | ☑ |
| `0015_partner_program.sql` | Programa de parceiros: `partner_accounts` (comissão, código de recomendação, preço de parceiro normal / de volume / a partir de quantos casamentos, faturação; leitura só super admin e membros do parceiro), `invitations.paid_by` (quem paga nos eventos de parceiros), `invitations.referred_by_brand_id`/`referred_at` e `payments.commission_*` (recomendações, fase B). Migra o preço próprio do Plano Completo de `brand_pricing_overrides` | ☑ |
| `0016_payment_guards.sql` | Proteções na base de dados (triggers, valem sejam quais forem as políticas antigas): em `invitations`, módulos ativos, datas de bloqueio/fim/limpeza, recomendação, marca e dono só mudam pelo servidor (service_role) ou por um super admin, e "quem paga" só pela equipa do parceiro; ao criar um evento, dono = quem cria e marca permitida. `payments`, `coupons`, `brands`, `brand_members`, `super_admins`, `partner_accounts`: escrita só servidor / super admin. `invitation_collaborators`: só quem edita o evento. Modo de experiência imposto na BD: 5 mensagens (`guestbook`) e 5 fotos (política restritiva em `storage.objects`, bucket `fotos_evento`) até pagar; RSVP público (`guests`) só com o convite publicado. Para confirmar no Supabase real: `supabase/selftest/payment_guards_test.sql` (não deixa dados) | ☑ |
| `0017_free_to_prepare_policies.sql` | Retira as regras RLS antigas `*_require_module*` (em `guests`, `guestbook`, `event_tables` e Storage `fotos_evento`), de antes de "grátis para preparar", que impediam os noivos de preparar a lista e as mesas e deixavam 0 fotos / 0 mensagens de experiência. Os limites passam a ser só os da `0016`. Acrescenta um trigger em `event_tables`: só quem edita o evento (ou a agência) mexe nas mesas. Mantém as regras de fim de prazo | ☑ |
| `0018_private_guest_data.sql` | Privacidade (RGPD): `guests` só legível/editável pela equipa do evento (dono, colaboradores, agência, super admin) — o RSVP público passa pelo servidor (`api/rsvp`, `api/seating`, `api/guest-link`); `guestbook` só a equipa lê (os convidados continuam a escrever); Storage: só a equipa do evento apaga fotos de `fotos_evento`, só super admin apaga em `invites`, e os `private_*` do livro de visitas não aparecem na listagem pública. **Correr só depois do deploy do código que a acompanha** | ☑ |
| `0019_photo_uploads.sql` | `photo_uploads` (caminho da foto, evento, hash da chave do browser; sem políticas, só o servidor): o convidado pode apagar as fotos que enviou, a partir do mesmo browser (`api/photos`, `lib/uploaderKey.ts`, página `/moments`). Pode correr antes ou depois do deploy | ☑ |
| `0020_private_invitations.sql` | Privacidade: `invitations` deixa de ser legível com a chave pública (saem as 3 regras `select true`); só a equipa do evento lê o seu registo (`inv_team_select`). As páginas públicas pedem os dados ao servidor (`api/public-event`, `lib/publicEvent.ts`; a página do convite usa a chave de serviço e só entrega `INVITE_PAGE_FIELDS` aos templates); a verificação de link ao criar evento passa para `api/slug-available`. Torna SECURITY DEFINER as funções antigas `is_invitation_active`, `is_module_unlocked`, `is_invitation_manager` e `is_super_admin`, usadas por regras de outras tabelas. **Correr só depois do deploy do código que a acompanha** | ☑ |

> Marcar a coluna "Aplicado" depois de correr em produção, para não haver
> dúvidas mais tarde.

## Tabelas que existiam antes desta pasta

Estas foram criadas à mão e **não têm ficheiro de migração**: `invitations`,
`guests`, `event_tables`, `invitation_collaborators`, `brands`, `brand_members`,
`super_admins`, `brand_pricing_overrides`, `coupons`, `payments`, `guestbook`,
`fotos_likes`. Se alguma vez for preciso recriar o projeto de raiz, é preciso
exportar o esquema atual do Supabase primeiro — não dá para reconstruir só a
partir daqui.

## Convenções

- **Nada de dados de exemplo** nestes ficheiros. Só esquema e políticas.
- **Ativar sempre RLS** em tabelas novas. Sem política, o Supabase deixa passar
  tudo o que tiver a chave anónima.
- As funções auxiliares de permissões (`dis_is_agency_for_event`,
  `dis_can_edit_event`, etc.) estão em `0001` e devem ser reutilizadas pelas
  tabelas seguintes, em vez de repetir subconsultas em cada política.
- `brand_id` é **texto sem chave estrangeira** de propósito: há marcas definidas
  em código (`lib/brands.ts`) que não existem na tabela `brands`, e uma chave
  estrangeira rebentaria com elas.
