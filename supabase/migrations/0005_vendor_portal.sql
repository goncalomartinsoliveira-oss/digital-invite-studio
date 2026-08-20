-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — Portal do Fornecedor
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0004 já aplicados.
--
-- Nota de segurança — isto é diferente de tudo o resto do módulo: é a
-- primeira tabela pensada para ser lida por alguém sem sessão nenhuma (o
-- fornecedor não tem conta DIS). Por isso NÃO existe política de leitura
-- pública aqui — a página do fornecedor lê esta tabela do servidor, com a
-- service_role key (lib/supabaseAdmin.ts), que ignora RLS por completo. As
-- políticas abaixo só cobrem quem gera/revoga o link (agência ou o casal,
-- os mesmos que já podem editar o evento).
--
-- Um link é por evento + "tipo" (kind), não por fornecedor: uma página
-- central (Partilha, no painel do evento) lista os tipos disponíveis, e a
-- agência/casal envia o mesmo link a quantos fornecedores fizer sentido —
-- por isso "invitation_id + kind" é único, e "Gerar novo" substitui o token
-- desse tipo, invalidando de imediato qualquer link antigo em circulação
-- (afeta todos os que o receberam, não só um).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.vendor_portal_links (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade,
  kind              text not null check (kind in ('timeline', 'full')),
  token             text not null unique,
  expires_at        timestamptz not null,
  created_by_email  text,
  created_at        timestamptz not null default now(),
  unique (invitation_id, kind)
);

create index if not exists vendor_portal_links_invitation_idx on public.vendor_portal_links (invitation_id);

alter table public.vendor_portal_links enable row level security;

-- Só gestão (ver/criar/regenerar/revogar) — nunca leitura pública por aqui.
drop policy if exists vendor_portal_links_manage on public.vendor_portal_links;
create policy vendor_portal_links_manage on public.vendor_portal_links
  for all using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );
