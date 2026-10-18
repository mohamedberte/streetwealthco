-- TRIPLEX : pays de livraison des commandes (livraison Union europeenne).
-- A executer apres 20261017000000_init.sql : Supabase > SQL Editor > coller ce fichier > Run.
-- Peut etre rejoue sans danger. Les commandes existantes passent a 'FR' (France).

alter table public.orders
  add column if not exists country text not null default 'FR';

-- Remplace create_order par une version qui enregistre le pays (code ISO 3166-1 alpha-2).
drop function if exists public.create_order(
  text, text, text, text, text, text, text, text, integer, integer, integer,
  timestamptz, text, uuid, jsonb
);

create or replace function public.create_order(
  p_email text,
  p_name text,
  p_phone text,
  p_zone text,
  p_country text,
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
    (number, token, user_id, status, email, name, phone, zone, country, city, postal_code,
     address, notes, subtotal, shipping, total, expires_at)
  values
    (v_number, p_token, p_user_id, 'pending_payment', lower(p_email), p_name, p_phone, p_zone,
     upper(p_country), p_city, p_postal_code, p_address, p_notes, p_subtotal, p_shipping, p_total,
     p_expires_at)
  returning id into v_id;

  insert into order_items (order_id, slug, name, size, quantity, unit_price)
  select v_id, e ->> 'slug', e ->> 'name', e ->> 'size',
         (e ->> 'quantity')::int, (e ->> 'unit_price')::int
    from jsonb_array_elements(p_items) e;

  return jsonb_build_object('id', v_id, 'number', v_number, 'token', p_token, 'total', p_total);
end;
$$;

-- Meme politique que le schema initial : fonctions reservees a service_role.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
