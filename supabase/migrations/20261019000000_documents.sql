-- TRIPLEX : factures, avoirs, historique des commandes et transporteur.
-- A executer apres 20261018000000_country.sql : Supabase > SQL Editor > coller ce fichier > Run.
-- Peut etre rejoue sans danger.

-- Transporteur choisi a l'expedition (le numero de suivi existe deja : orders.tracking).
alter table public.orders
  add column if not exists carrier text;

-- Historique d'une commande (paiement, expedition, remboursement, notes internes).
-- Aucune politique RLS : reserve au serveur (service_role), les notes internes restent privees.
create table if not exists public.order_events (
  id bigserial primary key,
  order_id integer not null references public.orders (id) on delete cascade,
  type text not null,
  detail text,
  actor text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- Compteurs de numerotation : un par type de document et par annee, sans trou.
create table if not exists public.document_counters (
  kind text not null,
  year integer not null,
  last integer not null default 0,
  primary key (kind, year)
);

-- Factures (FA-AAAA-000001) et avoirs (AV-AAAA-000001). Les donnees vendeur et client sont
-- figees a l'emission : un changement ulterieur des reglages ne modifie jamais une facture.
-- Montants en centimes.
create table if not exists public.invoices (
  id serial primary key,
  kind text not null check (kind in ('invoice', 'credit_note')),
  number text not null unique,
  order_id integer not null references public.orders (id) on delete restrict,
  related_id integer references public.invoices (id) on delete restrict,
  issued_at timestamptz not null default now(),
  country text not null,
  vat_rate numeric(5, 2) not null,
  total_ht integer not null,
  total_vat integer not null,
  total_ttc integer not null,
  seller jsonb not null,
  buyer jsonb not null,
  lines jsonb not null,
  pdf_key text,
  unique (order_id, kind)
);

create index if not exists invoices_issued_idx on public.invoices (issued_at);

do $$
begin
  alter table public.invoices add constraint invoices_totals_chk check (total_ttc = total_ht + total_vat);
exception when duplicate_object then null;
end $$;

-- Une facture emise ne se supprime pas et ne se modifie pas (seule la cle du PDF archive est mise a jour).
create or replace function public.invoices_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op in ('DELETE', 'TRUNCATE') then
    raise exception 'Une facture ne peut pas etre supprimee.';
  end if;
  if (to_jsonb(new) - 'pdf_key') is distinct from (to_jsonb(old) - 'pdf_key') then
    raise exception 'Une facture emise ne peut pas etre modifiee.';
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_guard on public.invoices;
create trigger invoices_guard
  before update or delete on public.invoices
  for each row execute function public.invoices_guard();

drop trigger if exists invoices_no_truncate on public.invoices;
create trigger invoices_no_truncate
  before truncate on public.invoices
  for each statement execute function public.invoices_guard();

-- Emet un document pour une commande. Idempotent (un seul document de chaque type par commande)
-- et sans trou : le compteur et la facture sont dans la meme transaction.
create or replace function public.issue_document(
  p_order_id integer,
  p_kind text,
  p_related_id integer,
  p_country text,
  p_vat_rate numeric,
  p_total_ht integer,
  p_total_vat integer,
  p_total_ttc integer,
  p_seller jsonb,
  p_buyer jsonb,
  p_lines jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_existing invoices%rowtype;
  v_year integer := extract(year from (now() at time zone 'Europe/Paris'))::integer;
  v_last integer;
  v_number text;
  v_id integer;
begin
  if p_kind not in ('invoice', 'credit_note') then
    raise exception 'KIND_INVALID';
  end if;

  -- Serialise les emissions concurrentes pour une meme commande.
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.payment_status <> 'paid' then
    raise exception 'ORDER_NOT_PAID';
  end if;
  if abs(p_total_ttc) <> v_order.total * 100 then
    raise exception 'TOTAL_MISMATCH';
  end if;

  select * into v_existing from invoices where order_id = p_order_id and kind = p_kind;
  if found then
    return jsonb_build_object('id', v_existing.id, 'number', v_existing.number, 'created', false);
  end if;

  insert into document_counters (kind, year, last)
  values (p_kind, v_year, 1)
  on conflict (kind, year) do update set last = document_counters.last + 1
  returning last into v_last;

  v_number := case p_kind when 'invoice' then 'FA' else 'AV' end
              || '-' || v_year::text || '-' || lpad(v_last::text, 6, '0');

  insert into invoices
    (kind, number, order_id, related_id, country, vat_rate, total_ht, total_vat, total_ttc,
     seller, buyer, lines)
  values
    (p_kind, v_number, p_order_id, p_related_id, upper(p_country), p_vat_rate, p_total_ht,
     p_total_vat, p_total_ttc, p_seller, p_buyer, p_lines)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'number', v_number, 'created', true);
end;
$$;

-- Tables internes : aucun acces depuis le navigateur.
revoke all on public.order_events, public.document_counters, public.invoices from anon, authenticated;
alter table public.order_events enable row level security;
alter table public.document_counters enable row level security;
alter table public.invoices enable row level security;

-- Reglages de facturation non publics : seules les cles du site restent lisibles par le navigateur.
drop policy if exists "reglages_lecture" on public.site_settings;
create policy "reglages_lecture" on public.site_settings
  for select to anon, authenticated
  using (key not like 'invoice.%');

-- Fonctions reservees a service_role (comme le schema initial).
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
