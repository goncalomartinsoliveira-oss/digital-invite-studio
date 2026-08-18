-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — Fase 0
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez (tudo tem "if not exists" / "or replace").
--
-- Este é o primeiro ficheiro de esquema versionado do projeto. Até aqui as
-- tabelas foram criadas à mão no painel do Supabase, sem histórico — o que
-- passa para dados de convite, mas não para dados financeiros de agências
-- com políticas de acesso finas. A partir daqui, qualquer alteração ao
-- esquema fica registada num ficheiro destes.
--
-- O que este ficheiro cria:
--   1. brands.planner_plan          — o interruptor de conta wedding planner
--   2. agency_vendors               — diretório de fornecedores da agência
--   3. event_costs                  — orçamento/custos por evento
--   4. event_cost_payments          — marcos de pagamento
--   5. event_tasks                  — checklist do evento
--   6. Funções auxiliares + RLS     — quem pode ver e editar o quê
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Interruptor de conta wedding planner ────────────────────────────────
-- Vazio  = parceiro normal (sem módulo de gestão)
-- piloto = módulo ligado, sem cobrança (fase de testes)
-- solo | profissional | agencia = planos pagos (a preencher pela subscrição)
--
-- Nota: as marcas "de código" (lib/brands.ts — dis, amazingmoon) não existem
-- nesta tabela. Uma agência piloto tem de ser criada como parceiro na base de
-- dados (Painel → Parceiros) para poder ter plano.

alter table public.brands
  add column if not exists planner_plan text;

alter table public.brands
  drop constraint if exists brands_planner_plan_check;

alter table public.brands
  add constraint brands_planner_plan_check
  check (planner_plan is null or planner_plan in ('piloto', 'solo', 'profissional', 'agencia'));


-- ── 2. Funções auxiliares de permissões ────────────────────────────────────
-- Usadas por todas as políticas abaixo. São SECURITY DEFINER para poderem
-- consultar invitations/brand_members sem esbarrar nas políticas dessas
-- tabelas (o que causaria recursão).

create or replace function public.dis_current_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.dis_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from super_admins
    where lower(user_email) = public.dis_current_email()
  );
$$;

-- É equipa da agência dona deste evento?
create or replace function public.dis_is_agency_for_event(inv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from invitations i
    join brand_members bm on bm.brand_id = i.brand_id
    where i.id = inv
      and lower(bm.user_email) = public.dis_current_email()
  );
$$;

-- É equipa desta agência? (para o diretório de fornecedores, que é da marca)
create or replace function public.dis_is_agency_for_brand(b text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from brand_members bm
    where bm.brand_id = b
      and lower(bm.user_email) = public.dis_current_email()
  );
$$;

-- É o casal (dono ou colaborador) deste evento? — leitura
create or replace function public.dis_can_read_event(inv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from invitations i
    where i.id = inv
      and (
        lower(i.user_email) = public.dis_current_email()
        or exists (
          select 1 from invitation_collaborators c
          where c.invitation_id = i.id
            and lower(c.user_email) = public.dis_current_email()
        )
      )
  );
$$;

-- É o casal com direito a escrever? (dono, ou colaborador com papel de editor)
create or replace function public.dis_can_edit_event(inv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from invitations i
    where i.id = inv
      and (
        lower(i.user_email) = public.dis_current_email()
        or exists (
          select 1 from invitation_collaborators c
          where c.invitation_id = i.id
            and lower(c.user_email) = public.dis_current_email()
            and c.role = 'editor'
        )
      )
  );
$$;


-- ── 3. Diretório de fornecedores (ao nível da agência) ─────────────────────
-- Vive na marca, não no evento: a agência acrescenta a quinta uma vez e
-- reutiliza-a em todos os casamentos. É daqui que sai, mais tarde, o
-- histórico de preços.
--
-- brand_id sem chave estrangeira de propósito: há marcas definidas em código
-- que não existem na tabela brands.

create table if not exists public.agency_vendors (
  id            uuid primary key default gen_random_uuid(),
  brand_id      text not null,
  name          text not null,
  category      text,
  contact_name  text,
  email         text,
  phone         text,
  website       text,
  notes         text,                       -- privado da agência, sempre
  rating        smallint check (rating between 1 and 5),
  created_at    timestamptz not null default now()
);

create index if not exists agency_vendors_brand_idx on public.agency_vendors (brand_id);

alter table public.agency_vendors enable row level security;

drop policy if exists agency_vendors_read on public.agency_vendors;
create policy agency_vendors_read on public.agency_vendors
  for select using (
    public.dis_is_super_admin() or public.dis_is_agency_for_brand(brand_id)
  );

drop policy if exists agency_vendors_write on public.agency_vendors;
create policy agency_vendors_write on public.agency_vendors
  for all using (
    public.dis_is_super_admin() or public.dis_is_agency_for_brand(brand_id)
  ) with check (
    public.dis_is_super_admin() or public.dis_is_agency_for_brand(brand_id)
  );


-- ── 4. Custos / orçamento do evento ────────────────────────────────────────
-- pricing_mode:
--   fixed      → valor fechado (unit_price_cents × quantity)
--   per_person → unit_price_cents × convidados confirmados, calculado ao vivo
--                na aplicação a partir da tabela guests (é este o ponto que
--                nenhum concorrente consegue copiar)
--
-- visibility:
--   agency  → só a equipa da agência vê. É o valor por omissão de propósito:
--             o honorário e as margens nunca podem escapar para o casal.
--   shared  → o casal também vê, e pode editar se tiver papel de editor.

create table if not exists public.event_costs (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  vendor_id         uuid references public.agency_vendors(id) on delete set null,
  category          text not null default 'outros',
  description       text,
  pricing_mode      text not null default 'fixed'
                      check (pricing_mode in ('fixed', 'per_person')),
  unit_price_cents  integer not null default 0,
  quantity          integer not null default 1,
  budgeted_cents    integer not null default 0,
  vat_pct           numeric(5,2) not null default 23,
  visibility        text not null default 'agency'
                      check (visibility in ('agency', 'shared')),
  notes             text,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists event_costs_invitation_idx on public.event_costs (invitation_id);
create index if not exists event_costs_vendor_idx on public.event_costs (vendor_id);

alter table public.event_costs enable row level security;

drop policy if exists event_costs_read on public.event_costs;
create policy event_costs_read on public.event_costs
  for select using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_read_event(invitation_id))
  );

drop policy if exists event_costs_insert on public.event_costs;
create policy event_costs_insert on public.event_costs
  for insert with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    -- o casal só pode criar linhas partilhadas, nunca privadas da agência
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  );

drop policy if exists event_costs_update on public.event_costs;
create policy event_costs_update on public.event_costs
  for update using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    -- e não pode tornar privada uma linha, nem tornar partilhada outra qualquer
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  );

drop policy if exists event_costs_delete on public.event_costs;
create policy event_costs_delete on public.event_costs
  for delete using (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  );


-- ── 5. Marcos de pagamento ─────────────────────────────────────────────────
-- O que transforma uma lista de custos num mapa de tesouraria: sinal a 30%,
-- 40% a 60 dias, restante na véspera.
--
-- invitation_id está desnormalizado (também está no custo-pai) de propósito:
-- mantém as políticas simples e rápidas, sem join a cada leitura.

create table if not exists public.event_cost_payments (
  id             uuid primary key default gen_random_uuid(),
  cost_id        uuid not null references public.event_costs(id) on delete cascade,
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  label          text,
  amount_cents   integer not null default 0,
  due_date       date,
  paid_at        date,
  created_at     timestamptz not null default now()
);

create index if not exists event_cost_payments_cost_idx on public.event_cost_payments (cost_id);
create index if not exists event_cost_payments_due_idx on public.event_cost_payments (invitation_id, due_date);

alter table public.event_cost_payments enable row level security;

drop policy if exists event_cost_payments_read on public.event_cost_payments;
create policy event_cost_payments_read on public.event_cost_payments
  for select using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or exists (
      select 1 from public.event_costs c
      where c.id = cost_id
        and c.visibility = 'shared'
        and public.dis_can_read_event(invitation_id)
    )
  );

drop policy if exists event_cost_payments_write on public.event_cost_payments;
create policy event_cost_payments_write on public.event_cost_payments
  for all using (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  ) with check (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  );


-- ── 6. Tarefas / checklist do evento ───────────────────────────────────────
-- due_offset_days guarda "quantos dias antes do casamento", para os prazos
-- poderem ser recalculados se a data do evento mudar.

create table if not exists public.event_tasks (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  title             text not null,
  notes             text,
  due_date          date,
  due_offset_days   integer,
  status            text not null default 'todo'
                      check (status in ('todo', 'doing', 'done')),
  assigned_to_email text,
  visibility        text not null default 'agency'
                      check (visibility in ('agency', 'shared')),
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists event_tasks_invitation_idx on public.event_tasks (invitation_id);
create index if not exists event_tasks_due_idx on public.event_tasks (invitation_id, due_date);

alter table public.event_tasks enable row level security;

drop policy if exists event_tasks_read on public.event_tasks;
create policy event_tasks_read on public.event_tasks
  for select using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_read_event(invitation_id))
  );

drop policy if exists event_tasks_insert on public.event_tasks;
create policy event_tasks_insert on public.event_tasks
  for insert with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  );

drop policy if exists event_tasks_update on public.event_tasks;
create policy event_tasks_update on public.event_tasks
  for update using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or (visibility = 'shared' and public.dis_can_edit_event(invitation_id))
  );

drop policy if exists event_tasks_delete on public.event_tasks;
create policy event_tasks_delete on public.event_tasks
  for delete using (
    public.dis_is_super_admin() or public.dis_is_agency_for_event(invitation_id)
  );
