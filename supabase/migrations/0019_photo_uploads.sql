-- ═══════════════════════════════════════════════════════════════════════════
-- Fotos dos convidados: quem enviou pode apagar (só as suas)
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Funciona antes ou depois do deploy do código (sem esta tabela, o
-- envio de fotos pela página dos convidados avisa que não foi possível).
--
-- Cada browser de convidado tem uma chave secreta (localStorage). Ao enviar
-- uma foto, o servidor (api/photos) cria o caminho, dá um link de envio
-- temporário e regista aqui "este ficheiro é desta chave" — guarda só o hash
-- da chave, nunca a chave. Para apagar, o convidado manda a chave; o servidor
-- compara o hash e apaga só se for o mesmo browser que enviou.
-- Sem políticas: só o servidor (service_role) lê e escreve.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.photo_uploads (
  path          text primary key,          -- "<evento>/<ficheiro>" no bucket fotos_evento
  invitation_id uuid not null,
  uploader_hash text not null,              -- sha256 da chave do browser
  created_at    timestamptz not null default now()
);

create index if not exists photo_uploads_owner_idx on public.photo_uploads (invitation_id, uploader_hash);

alter table public.photo_uploads enable row level security;
