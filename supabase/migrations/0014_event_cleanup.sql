-- ═══════════════════════════════════════════════════════════════════════════
-- Limpeza de eventos expirados e aviso de fim de prazo
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0013 já aplicados.
--
-- Um evento fica online até 60 dias depois do casamento (invitations.expires_at).
-- Depois disso o super admin pode apagar o conteúdo em Administração › Gestão ›
-- Arquivados (rota app/api/admin/event-cleanup, com a service_role key):
-- ficheiros do Storage, convidados, mesas, links, mensagens do livro de visitas
-- e o conteúdo do convite. O registo do evento e os pagamentos ficam.
--
--   content_purged_at     — quando o conteúdo foi apagado (null = intacto)
--   expiry_notice_sent_at — quando foi enviado aos noivos o e-mail a avisar do
--                           fim do prazo (app/api/admin/expiry-notice)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.invitations add column if not exists content_purged_at timestamptz;
alter table public.invitations add column if not exists expiry_notice_sent_at timestamptz;
