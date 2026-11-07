-- ═══════════════════════════════════════════════════════════════════════════
-- "Grátis para preparar": retirar as regras antigas que exigiam módulos pagos
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0016 já aplicada (é ela que passa a impor os limites).
--
-- Antes do modelo "grátis para preparar, paga-se para publicar", havia regras
-- RLS restritivas (*_require_module*) que recusavam qualquer escrita sem o
-- módulo pago. O teste da 0016 mostrou o efeito: os noivos não conseguiam
-- adicionar convidados nem montar mesas antes de pagar, e as fotos e o livro
-- de visitas aceitavam 0 envios em vez dos 5 de experiência.
--
-- Estas regras saem; a 0016 já faz a separação certa:
--   guests      — dono, editores e agência preparam a lista à vontade; o RSVP
--                 dos convidados só funciona com o convite publicado.
--   guestbook   — 5 mensagens até pagar.
--   fotos_evento (Storage) — 5 fotos até pagar.
--   event_tables (mesas) — passa a ter um trigger próprio: só quem edita o
--                 evento (ou a agência, ou um privilegiado) mexe nas mesas.
-- As regras de fim de prazo (*_block_after_expiry*) mantêm-se.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists guests_require_module_ins on public.guests;
drop policy if exists guests_require_module_upd on public.guests;
drop policy if exists guestbook_require_module_ins on public.guestbook;
drop policy if exists event_tables_require_module_ins on public.event_tables;
drop policy if exists event_tables_require_module_upd on public.event_tables;
drop policy if exists fotos_evento_require_module on storage.objects;

-- Mesas: só quem gere o evento. A página pública /seating só lê.
create or replace function public.dis_guard_event_tables()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare inv uuid;
begin
  if public.dis_is_privileged() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  inv := case when tg_op = 'DELETE' then old.invitation_id else new.invitation_id end;
  if not (public.dis_can_edit_event(inv) or public.dis_is_agency_for_event(inv))
     or (tg_op = 'UPDATE' and new.invitation_id is distinct from old.invitation_id) then
    raise exception 'dis_guard: só quem edita o evento mexe nas mesas' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_a_guard_event_tables on public.event_tables;
create trigger trg_a_guard_event_tables
  before insert or update or delete on public.event_tables
  for each row execute function public.dis_guard_event_tables();
