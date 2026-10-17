-- TRIPLEX : schema Supabase (PostgreSQL).
-- A executer une fois : Supabase > SQL Editor > coller ce fichier > Run
-- (ou `supabase db push` avec la CLI Supabase). Le script peut etre rejoue sans danger.
--
-- Principes :
--  * Le site ecrit et lit via la cle service_role (serveur uniquement) : elle contourne le RLS.
--  * Le RLS est actif partout. Le public (cle anon) ne peut lire que le catalogue et le contenu ;
--    un client connecte ne peut lire que SES commandes. Aucune ecriture publique.
--  * Les operations sensibles (stock, commandes) sont des fonctions SQL transactionnelles,
--    appelables uniquement par service_role.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.inventory (
  slug text not null,
  size text not null,
  stock integer not null check (stock >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  primary key (slug, size)
);

create sequence if not exists public.order_seq start 1001;

create table if not exists public.orders (
  id serial primary key,
  number text not null unique,
  token text not null unique,
  -- Compte client (optionnel : la commande invite reste possible). Conservee si le compte est supprime.
  user_id uuid references auth.users (id) on delete set null,
  status text not null,
  payment_status text not null default 'unpaid',
  payment_ref text,
  email text not null,
  name text not null,
  phone text not null,
  zone text not null,
  city text not null,
  postal_code text not null,
  address text not null,
  notes text,
  subtotal integer not null,
  shipping integer not null,
  total integer not null,
  tracking text,
  refund_ref text,
  refunded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status, expires_at);
create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_email_idx on public.orders (email);

create table if not exists public.order_items (
  id serial primary key,
  order_id integer not null references public.orders (id) on delete cascade,
  slug text not null,
  name text not null,
  size text not null,
  quantity integer not null,
  unit_price integer not null
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.waitlist (
  id serial primary key,
  slug text not null,
  size text not null,
  email text not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (slug, size, email)
);

-- Journal pseudonymise pour la limitation de debit (empreintes, purge automatique).
create table if not exists public.rate_events (
  id bigserial primary key,
  bucket text not null,
  key text not null,
  at timestamptz not null default now()
);

create index if not exists rate_events_idx on public.rate_events (bucket, key, at);

-- Contenu gere depuis l'admin. Une ligne remplace la valeur par defaut du code (meme slug).
create table if not exists public.products (
  slug text primary key,
  position integer not null default 0,
  name text not null,
  word text not null,
  silhouette text not null,
  price integer not null check (price >= 0),
  description text not null default '',
  fabric text not null default '',
  edition text not null default '',
  sizes text not null,
  stock_per_size integer not null default 0,
  kind text not null,
  tone_bg text not null,
  tone_ink text not null,
  tone_fill text not null,
  tone_line text not null,
  tone_accent text,
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_pages (
  slug text primary key,
  title text not null,
  intro text not null default '',
  content text not null default '',
  position integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null
);

create table if not exists public.product_scenes (
  id bigserial primary key,
  slug text not null,
  position integer not null default 0,
  title text not null,
  caption text not null default '',
  image text not null,
  created_at timestamptz not null default now()
);

create index if not exists product_scenes_slug_idx on public.product_scenes (slug, position);

-- ---------------------------------------------------------------------------
-- Fonctions transactionnelles (stock et commandes)
-- ---------------------------------------------------------------------------

-- Libere le stock reserve par les commandes en ligne dont le delai est depasse.
create or replace function public.release_expired()
returns void
language plpgsql
set search_path = public
as $$
begin
  with expired as (
    update orders
       set status = 'expired', updated_at = now()
     where status = 'pending_payment' and expires_at < now()
     returning id
  )
  update inventory i
     set reserved = greatest(i.reserved - s.qty, 0)
    from (
      select oi.slug, oi.size, sum(oi.quantity)::int as qty
        from order_items oi
        join expired e on e.id = oi.order_id
       group by oi.slug, oi.size
    ) s
   where i.slug = s.slug and i.size = s.size;
end;
$$;

-- Cree une commande en attente de paiement et reserve le stock (tout ou rien).
-- p_items : [{ "slug", "size", "quantity", "name", "unit_price" }, ...] (lignes uniques par slug+taille).
-- Erreur 'SOLD_OUT|slug|taille' si une ligne n'est plus disponible.
create or replace function public.create_order(
  p_email text,
  p_name text,
  p_phone text,
  p_zone text,
  p_city text,
  p_postal_code text,
  p_address text,
  p_notes text,
  p_subtotal integer,
  p_shipping integer,
  p_total integer,
  p_expires_at timestamptz,
  p_token text,
  p_user_id uuid,
  p_items jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  line record;
  v_available integer;
  v_id integer;
  v_number text;
begin
  perform release_expired();

  -- Verrouillage dans un ordre stable (evite les deadlocks) puis verification de toutes les lignes.
  for line in
    select e ->> 'slug' as slug, e ->> 'size' as size, (e ->> 'quantity')::int as quantity
      from jsonb_array_elements(p_items) e
     order by 1, 2
  loop
    select (inv.stock - inv.reserved) into v_available
      from inventory inv
     where inv.slug = line.slug and inv.size = line.size
       for update;
    if v_available is null or v_available < line.quantity then
      raise exception 'SOLD_OUT|%|%', line.slug, line.size using errcode = 'P0001';
    end if;
  end loop;

  update inventory inv
     set reserved = inv.reserved + t.quantity
    from (
      select e ->> 'slug' as slug, e ->> 'size' as size, (e ->> 'quantity')::int as quantity
        from jsonb_array_elements(p_items) e
    ) t
   where inv.slug = t.slug and inv.size = t.size;

  v_number := 'TRX-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_seq')::text, 5, '0');

  insert into orders
    (number, token, user_id, status, email, name, phone, zone, city, postal_code,
     address, notes, subtotal, shipping, total, expires_at)
  values
    (v_number, p_token, p_user_id, 'pending_payment', lower(p_email), p_name, p_phone, p_zone,
     p_city, p_postal_code, p_address, p_notes, p_subtotal, p_shipping, p_total, p_expires_at)
  returning id into v_id;

  insert into order_items (order_id, slug, name, size, quantity, unit_price)
  select v_id, e ->> 'slug', e ->> 'name', e ->> 'size',
         (e ->> 'quantity')::int, (e ->> 'unit_price')::int
    from jsonb_array_elements(p_items) e;

  return jsonb_build_object('id', v_id, 'number', v_number, 'token', p_token, 'total', p_total);
end;
$$;

-- Enregistre un paiement confirme. Idempotent (retour client + webhook).
-- Retourne { result: paid | already | refund_needed | mismatch | not_found, order_id }.
create or replace function public.mark_paid(p_number text, p_amount numeric default null)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  o orders%rowtype;
  line record;
  v_available integer;
  v_short boolean := false;
begin
  select * into o from orders where number = p_number for update;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  if o.payment_status = 'paid' then
    return jsonb_build_object('result', 'already', 'order_id', o.id);
  end if;
  if p_amount is not null and p_amount <> o.total then
    return jsonb_build_object('result', 'mismatch', 'order_id', o.id);
  end if;

  if o.status = 'pending_payment' then
    -- Reservation -> vente.
    update inventory inv
       set stock = greatest(inv.stock - oi.quantity, 0),
           reserved = greatest(inv.reserved - oi.quantity, 0)
      from order_items oi
     where oi.order_id = o.id and inv.slug = oi.slug and inv.size = oi.size;
  elsif o.status = 'expired' then
    -- Paiement tardif : on tente de reprendre le stock, sinon remboursement.
    for line in
      select oi.slug, oi.size, sum(oi.quantity)::int as quantity
        from order_items oi
       where oi.order_id = o.id
       group by oi.slug, oi.size
       order by 1, 2
    loop
      select (inv.stock - inv.reserved) into v_available
        from inventory inv
       where inv.slug = line.slug and inv.size = line.size
         for update;
      if v_available is null or v_available < line.quantity then
        v_short := true;
      end if;
    end loop;

    if v_short then
      update orders
         set status = 'refund_needed', payment_status = 'paid', updated_at = now()
       where id = o.id;
      return jsonb_build_object('result', 'refund_needed', 'order_id', o.id);
    end if;

    update inventory inv
       set stock = inv.stock - oi.quantity
      from order_items oi
     where oi.order_id = o.id and inv.slug = oi.slug and inv.size = oi.size;
  else
    update orders
       set status = 'refund_needed', payment_status = 'paid', updated_at = now()
     where id = o.id;
    return jsonb_build_object('result', 'refund_needed', 'order_id', o.id);
  end if;

  update orders
     set status = 'confirmed', payment_status = 'paid', expires_at = null, updated_at = now()
   where id = o.id;
  return jsonb_build_object('result', 'paid', 'order_id', o.id);
end;
$$;

-- Annule une commande et remet les pieces en stock. Retourne les lignes concernees.
create or replace function public.cancel_order(p_id integer)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  o orders%rowtype;
  v_lines jsonb;
begin
  select * into o from orders where id = p_id for update;
  if not found or o.status not in ('pending_payment', 'confirmed', 'shipped', 'refund_needed') then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('slug', oi.slug, 'size', oi.size, 'quantity', oi.quantity)), '[]'::jsonb)
    into v_lines
    from order_items oi
   where oi.order_id = p_id;

  if o.status = 'pending_payment' then
    update inventory inv
       set reserved = greatest(inv.reserved - oi.quantity, 0)
      from order_items oi
     where oi.order_id = p_id and inv.slug = oi.slug and inv.size = oi.size;
  elsif o.status in ('confirmed', 'shipped') then
    update inventory inv
       set stock = inv.stock + oi.quantity
      from order_items oi
     where oi.order_id = p_id and inv.slug = oi.slug and inv.size = oi.size;
  end if;
  -- refund_needed : le stock n'a jamais ete decremente, rien a remettre.

  update orders set status = 'cancelled', updated_at = now() where id = p_id;
  return v_lines;
end;
$$;

-- Marque une commande comme remboursee (le remboursement Stripe est deja fait).
-- Remet les pieces en stock si demande (retour physique) et retourne les lignes remises.
create or replace function public.mark_refunded(p_id integer, p_ref text, p_restock boolean)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  o orders%rowtype;
  v_lines jsonb := '[]'::jsonb;
begin
  select * into o from orders where id = p_id for update;
  if not found or o.status = 'refunded' then
    return '[]'::jsonb;
  end if;

  if p_restock and o.status in ('confirmed', 'shipped', 'delivered') then
    select coalesce(jsonb_agg(jsonb_build_object('slug', oi.slug, 'size', oi.size, 'quantity', oi.quantity)), '[]'::jsonb)
      into v_lines
      from order_items oi
     where oi.order_id = p_id;

    update inventory inv
       set stock = inv.stock + oi.quantity
      from order_items oi
     where oi.order_id = p_id and inv.slug = oi.slug and inv.size = oi.size;
  end if;

  update orders
     set status = 'refunded', refund_ref = p_ref, refunded_at = now(), updated_at = now()
   where id = p_id;
  return v_lines;
end;
$$;

-- Fixe le stock d'une taille (jamais en dessous de la quantite reservee).
create or replace function public.set_stock(p_slug text, p_size text, p_stock integer)
returns void
language sql
set search_path = public
as $$
  update inventory
     set stock = greatest(p_stock, reserved)
   where slug = p_slug and size = p_size;
$$;

-- Marque comme prevenues (par ordre d'inscription) les personnes en attente, dans la limite du
-- stock disponible, et retourne leurs adresses e-mail.
create or replace function public.notify_waitlist(p_slug text, p_size text)
returns text[]
language plpgsql
set search_path = public
as $$
declare
  v_available integer;
  v_emails text[];
begin
  select greatest(inv.stock - inv.reserved, 0) into v_available
    from inventory inv
   where inv.slug = p_slug and inv.size = p_size;

  if coalesce(v_available, 0) <= 0 then
    return '{}';
  end if;

  with picked as (
    select w.id
      from waitlist w
     where w.slug = p_slug and w.size = p_size and w.notified_at is null
     order by w.created_at
     limit v_available
  ), upd as (
    update waitlist w
       set notified_at = now()
      from picked
     where w.id = picked.id
     returning w.email
  )
  select coalesce(array_agg(upd.email), '{}') into v_emails from upd;

  return v_emails;
end;
$$;

-- Indicateurs du tableau de bord (montants TTC, livraison comprise).
create or replace function public.dashboard_stats()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'paid_orders', count(*) filter (where payment_status = 'paid' and status in ('confirmed', 'shipped', 'delivered')),
    'revenue', coalesce(sum(total) filter (where payment_status = 'paid' and status in ('confirmed', 'shipped', 'delivered')), 0),
    'revenue_7d', coalesce(sum(total) filter (where payment_status = 'paid' and status in ('confirmed', 'shipped', 'delivered') and created_at > now() - interval '7 days'), 0),
    'revenue_30d', coalesce(sum(total) filter (where payment_status = 'paid' and status in ('confirmed', 'shipped', 'delivered') and created_at > now() - interval '30 days'), 0),
    'to_ship', count(*) filter (where status = 'confirmed'),
    'refund_needed', count(*) filter (where status = 'refund_needed'),
    'pending', count(*) filter (where status = 'pending_payment'),
    'refunded_count', count(*) filter (where status = 'refunded'),
    'refunded_total', coalesce(sum(total) filter (where status = 'refunded'), 0),
    'by_product', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.qty desc), '[]'::jsonb)
        from (
          select oi.slug, oi.name, sum(oi.quantity)::int as qty,
                 sum(oi.quantity * oi.unit_price)::int as revenue
            from order_items oi
            join orders o on o.id = oi.order_id
           where o.payment_status = 'paid' and o.status in ('confirmed', 'shipped', 'delivered')
           group by oi.slug, oi.name
        ) p
    )
  )
  from orders;
$$;

-- ---------------------------------------------------------------------------
-- Securite : droits et RLS
-- ---------------------------------------------------------------------------

-- Les fonctions ne sont appelables que par le serveur (service_role).
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

-- Tables internes : aucun acces public ni client.
revoke all on public.inventory, public.waitlist, public.rate_events from anon, authenticated;

alter table public.inventory enable row level security;
alter table public.waitlist enable row level security;
alter table public.rate_events enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;
alter table public.product_scenes enable row level security;
alter table public.site_pages enable row level security;
alter table public.site_settings enable row level security;

-- Catalogue et contenu : lecture publique, ecriture reservee au serveur.
drop policy if exists "catalogue_lecture" on public.products;
create policy "catalogue_lecture" on public.products for select to anon, authenticated using (active);

drop policy if exists "scenes_lecture" on public.product_scenes;
create policy "scenes_lecture" on public.product_scenes for select to anon, authenticated using (true);

drop policy if exists "pages_lecture" on public.site_pages;
create policy "pages_lecture" on public.site_pages for select to anon, authenticated using (active);

drop policy if exists "reglages_lecture" on public.site_settings;
create policy "reglages_lecture" on public.site_settings for select to anon, authenticated using (true);

-- Un client connecte lit uniquement ses commandes.
drop policy if exists "commandes_du_client" on public.orders;
create policy "commandes_du_client" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "lignes_du_client" on public.order_items;
create policy "lignes_du_client" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
       where o.id = order_items.order_id and o.user_id = (select auth.uid())
    )
  );

-- Aucune ecriture depuis le navigateur : on retire les droits d'ecriture aux roles publics.
revoke insert, update, delete, truncate on
  public.orders, public.order_items, public.products, public.product_scenes,
  public.site_pages, public.site_settings
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Contraintes d'integrite (rejouables)
-- ---------------------------------------------------------------------------

do $$
begin
  alter table public.orders add constraint orders_status_chk check (status in
    ('pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled', 'expired', 'refund_needed', 'refunded'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_payment_status_chk check (payment_status in ('unpaid', 'paid'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_zone_chk check (zone in ('france', 'europe'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_amounts_chk
    check (subtotal >= 0 and shipping >= 0 and total = subtotal + shipping);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.order_items add constraint order_items_qty_chk check (quantity > 0 and unit_price >= 0);
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Administrateur
-- ---------------------------------------------------------------------------
-- 1. Supabase > Authentication > Users > Add user (e-mail + mot de passe, "Auto Confirm User").
-- 2. Donner le role admin (non modifiable par l'utilisateur, il vit dans app_metadata) :
--
--    update auth.users
--       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
--     where email = 'vous@exemple.com';
