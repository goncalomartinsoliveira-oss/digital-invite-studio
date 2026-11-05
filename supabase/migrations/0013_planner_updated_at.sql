-- ═══════════════════════════════════════════════════════════════════════════
-- Data da última alteração nas tabelas do Planeamento (medir o piloto)
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0012 já aplicados.
--
-- As tabelas do Planeamento só tinham created_at, por isso uma agência que
-- trabalha (marca tarefas como feitas, regista pagamentos, ajusta valores) não
-- deixava rasto. Com updated_at mantido por trigger, o cartão "Piloto Wedding
-- Planner" (Administração › Gestão, só super-admin) consegue mostrar a última
-- atividade real de cada agência. Sem esta migração, o cartão usa só as datas
-- de criação.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.dis_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'event_tasks', 'event_costs', 'event_cost_payments', 'event_cost_notes',
    'event_documents', 'event_timeline', 'event_moodboard_items', 'agency_vendors'
  ] loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz', t);
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.dis_touch_updated_at()', t || '_touch_updated_at', t);
  end loop;
end;
$$;
