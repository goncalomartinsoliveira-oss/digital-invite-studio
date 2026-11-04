-- ═══════════════════════════════════════════════════════════════════════════
-- Código de acesso ao convite (opcional) + "quem já abriu" nos links pessoais
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0010 já aplicados.
--
-- 1) Código de acesso. Desligado por omissão. Quando o administrador do evento
--    o liga, o convite só abre a quem introduzir o código de 4 dígitos.
--    - invitations.access_code_enabled / access_code_version são NÃO secretos
--      (a página precisa de os ler para saber se pede o código e para
--      invalidar os cookies antigos quando o código muda).
--    - O código em si fica em invite_access, SÓ legível por quem gere o
--      evento. Nunca na tabela invitations, que o convite lê com a chave
--      pública.
--    - A verificação corre no servidor (app/api/invite-access) com a
--      service_role key. invite_access_attempts regista tentativas falhadas
--      para limitar tentativas (4 dígitos = 10 000 combinações, por isso o
--      limite é essencial); sem políticas, só o servidor lhe toca.
--
-- 2) "Quem já abriu": datas e contagem de aberturas em guest_links (0010).
--    Só contagem e datas — sem IP nem dados do aparelho.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.invitations add column if not exists access_code_enabled boolean not null default false;
alter table public.invitations add column if not exists access_code_version integer not null default 1;

create table if not exists public.invite_access (
  invitation_id  uuid primary key references public.invitations(id) on delete cascade,
  code           text not null check (code ~ '^[0-9]{4}$'),
  updated_at     timestamptz not null default now()
);

alter table public.invite_access enable row level security;

-- Só quem edita o evento vê e altera o código (nem leitores, nem o público).
drop policy if exists invite_access_manage on public.invite_access;
create policy invite_access_manage on public.invite_access
  for all using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );

create table if not exists public.invite_access_attempts (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  ip_hash        text not null,
  created_at     timestamptz not null default now()
);

create index if not exists invite_access_attempts_lookup_idx
  on public.invite_access_attempts (invitation_id, ip_hash, created_at);

-- RLS ligada e SEM políticas: só a service_role (servidor) lê e escreve.
alter table public.invite_access_attempts enable row level security;

alter table public.guest_links add column if not exists first_opened_at timestamptz;
alter table public.guest_links add column if not exists last_opened_at  timestamptz;
alter table public.guest_links add column if not exists open_count      integer not null default 0;
