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
| `0003_documents.sql` | `event_documents` — documentos/contratos por evento, opcionalmente ligados a uma linha de custo | ☐ |

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
