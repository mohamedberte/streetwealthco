-- TRIPLEX : ouverture programmee d'une piece (« drop »).
-- A executer apres 20261020000000_decimal_prices.sql : Supabase > SQL Editor > coller ce fichier > Run.
-- Peut etre rejoue sans danger. Une piece sans date d'ouverture reste en vente immediatement.

alter table public.products
  add column if not exists opens_at timestamptz;
