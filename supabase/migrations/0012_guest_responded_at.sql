-- ═══════════════════════════════════════════════════════════════════════════
-- Quando é que cada convidado respondeu ao RSVP
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0011 já aplicados.
--
-- Alimenta o sinal "respostas novas nas últimas 24 horas" em Wedding Planner ›
-- Esta semana. A tabela guests não tinha nenhuma data de resposta; um trigger
-- (e não o código) preenche-a sempre que o estado passa a confirmado/recusado,
-- seja qual for o caminho: RSVP pelo link geral (cliente), pelo link pessoal
-- (servidor), ou alteração à mão no painel. Sem esta migração, a aplicação
-- simplesmente não mostra esse sinal.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.guests add column if not exists responded_at timestamptz;

create or replace function public.dis_guests_set_responded_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and new.status in ('confirmed', 'declined') then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists guests_set_responded_at on public.guests;
create trigger guests_set_responded_at
  before update on public.guests
  for each row execute function public.dis_guests_set_responded_at();
