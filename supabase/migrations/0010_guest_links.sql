-- ═══════════════════════════════════════════════════════════════════════════
-- Links personalizados por grupo de convidados (opcional)
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0009 já aplicados.
--
-- Um link por grupo de convidados (guests.group_id): quem o abre vê o seu nome
-- e os lugares reservados no ecrã de entrada do convite, e o RSVP abre
-- direto no próprio grupo, sem pesquisar o nome. É 100% opcional — um evento
-- sem linhas nesta tabela continua a funcionar exatamente como antes, com o
-- link geral e a pesquisa por nome.
--
-- O nome mostrado e o número de lugares NÃO ficam aqui por omissão: são
-- calculados ao vivo a partir dos membros do grupo (ver lib/guestLinks.ts),
-- para acompanharem alterações à lista. As colunas display_name e
-- seats_override só guardam correções manuais do casal.
--
-- Sem política de leitura/escrita pública, de propósito: a página e o RSVP
-- passam pelo servidor (app/api/guest-link) com a service_role key, que
-- devolve só os membros do grupo do token — nunca a lista toda. Mesmo modelo
-- do Portal do Fornecedor e do Moodboard partilhado.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.guest_links (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references public.invitations(id) on delete cascade,
  group_id        text not null,
  token           text not null unique,
  display_name    text,
  seats_override  integer check (seats_override is null or seats_override >= 0),
  created_at      timestamptz not null default now(),
  unique (invitation_id, group_id)
);

create index if not exists guest_links_invitation_idx on public.guest_links (invitation_id);

alter table public.guest_links enable row level security;

-- Gestão (ver/criar/editar/revogar) por quem pode editar o evento.
drop policy if exists guest_links_manage on public.guest_links;
create policy guest_links_manage on public.guest_links
  for all using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );

-- Quem só pode ler o evento (leitor/colaborador "viewer") vê os links, não os altera.
drop policy if exists guest_links_read on public.guest_links;
create policy guest_links_read on public.guest_links
  for select using (public.dis_can_read_event(invitation_id));
