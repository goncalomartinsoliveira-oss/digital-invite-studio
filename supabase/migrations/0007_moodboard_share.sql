-- ═══════════════════════════════════════════════════════════════════════════
-- Módulo Wedding Planner — link de partilha do Moodboard
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0006 já aplicados.
--
-- Ao contrário do Portal do Fornecedor (só leitura), este link também
-- permite ESCREVER: quem o recebe (ex.: madrinhas, família) pode acrescentar
-- imagens/links ao Moodboard sem conta DIS. Mesmo modelo de acesso do
-- Portal do Fornecedor — token sem login, gerado pela agência ou pelo
-- casal — mas com uma superfície de escrita pública nova, por isso com
-- limites que o Portal do Fornecedor não precisava:
--   - só acrescentar, nunca apagar nem gerir secções (isso fica só para
--     quem tem conta, no painel);
--   - um limite total de itens por moodboard (ver app/api/moodboard/public),
--     como travão simples contra spam, já que não há infraestrutura de
--     rate-limiting nesta app.
--
-- Um link por evento (não por "tipo", ao contrário do vendor_portal_links) —
-- é sempre a mesma coisa: ver e contribuir.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.moodboard_share_links (
  id                uuid primary key default gen_random_uuid(),
  invitation_id     uuid not null references public.invitations(id) on delete cascade unique,
  token             text not null unique,
  expires_at        timestamptz not null,
  created_by_email  text,
  created_at        timestamptz not null default now()
);

create index if not exists moodboard_share_links_invitation_idx on public.moodboard_share_links (invitation_id);

alter table public.moodboard_share_links enable row level security;

-- Só gestão (ver/criar/regenerar/revogar) — a leitura E escrita públicas
-- passam pelo servidor com a service_role key (lib/moodboardShare.ts),
-- nunca por uma política de RLS aberta ao anon.
drop policy if exists moodboard_share_links_manage on public.moodboard_share_links;
create policy moodboard_share_links_manage on public.moodboard_share_links
  for all using (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  ) with check (
    public.dis_is_super_admin()
    or public.dis_is_agency_for_event(invitation_id)
    or public.dis_can_edit_event(invitation_id)
  );
