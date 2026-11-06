-- ═══════════════════════════════════════════════════════════════════════════
-- Programa de parceiros (fase A; já com os campos da fase B, recomendações)
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0001-0014 já aplicados.
--
-- Um parceiro é uma marca (brands) com funcionalidades ligadas pelo super
-- admin. As condições comerciais ficam numa tabela própria, partner_accounts,
-- e não em brands: brands é lida por qualquer visitante (logótipo dos
-- convites), e aqui há comissões, preços e IBAN.
--
--   partner_accounts   — uma linha por parceiro: recomendação (comissão e
--                        código), preço de parceiro (normal, de volume e a
--                        partir de quantos casamentos), dados de faturação.
--                        Leitura: super admin e membros desse parceiro.
--                        Escrita: só super admin.
--   invitations        — referred_by_brand_id / referred_at (quem recomendou,
--                        fase B) e paid_by (eventos de parceiros: quem paga o
--                        Plano Completo, 'partner' ou 'couple'; vazio = partner).
--   payments           — comissão gravada no momento da venda (fase B).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.partner_accounts (
  brand_id                    text primary key,
  referral_enabled            boolean not null default false,
  commission_pct              numeric(5,2) not null default 15 check (commission_pct >= 0 and commission_pct <= 100),
  referral_code               text unique,
  partner_price_enabled       boolean not null default false,
  partner_price_cents         integer not null default 7900 check (partner_price_cents >= 0),
  partner_volume_price_cents  integer not null default 6900 check (partner_volume_price_cents >= 0),
  partner_volume_threshold    integer not null default 10 check (partner_volume_threshold >= 1),
  billing_name                text,
  billing_nif                 text,
  billing_iban                text,
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

alter table public.partner_accounts enable row level security;

drop policy if exists partner_accounts_read on public.partner_accounts;
create policy partner_accounts_read on public.partner_accounts
  for select using (public.dis_is_super_admin() or public.dis_is_agency_for_brand(brand_id));

drop policy if exists partner_accounts_write on public.partner_accounts;
create policy partner_accounts_write on public.partner_accounts
  for all using (public.dis_is_super_admin()) with check (public.dis_is_super_admin());

drop trigger if exists partner_accounts_touch_updated_at on public.partner_accounts;
create trigger partner_accounts_touch_updated_at before update on public.partner_accounts
  for each row execute function public.dis_touch_updated_at();

-- Preço próprio do Plano Completo que alguns parceiros já tinham em
-- brand_pricing_overrides passa a ser o preço de parceiro (a tabela antiga
-- fica, sem uso, para histórico).
insert into public.partner_accounts (brand_id, partner_price_enabled, partner_price_cents, partner_volume_price_cents)
select o.brand_id, true, o.price_cents, least(o.price_cents, 6900)
from public.brand_pricing_overrides o
where o.item_type = 'bundle' and o.item_id = 'completo'
on conflict (brand_id) do nothing;

alter table public.invitations add column if not exists referred_by_brand_id text;
alter table public.invitations add column if not exists referred_at timestamptz;
alter table public.invitations add column if not exists paid_by text;
alter table public.invitations drop constraint if exists invitations_paid_by_check;
alter table public.invitations add constraint invitations_paid_by_check check (paid_by is null or paid_by in ('partner', 'couple'));

alter table public.payments add column if not exists referral_brand_id text;
alter table public.payments add column if not exists commission_pct numeric(5,2);
alter table public.payments add column if not exists commission_cents integer;
alter table public.payments add column if not exists commission_status text;
alter table public.payments add column if not exists commission_paid_at timestamptz;
alter table public.payments drop constraint if exists payments_commission_status_check;
alter table public.payments add constraint payments_commission_status_check
  check (commission_status is null or commission_status in ('pending', 'approved', 'paid', 'cancelled'));
