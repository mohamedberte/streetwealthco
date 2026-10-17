import "server-only";

/** Schéma PostgreSQL, créé automatiquement au premier accès (idempotent). */
export const SCHEMA = `
create table if not exists inventory (
  slug text not null,
  size text not null,
  stock integer not null check (stock >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  primary key (slug, size)
);

create sequence if not exists order_seq start 1001;

create table if not exists orders (
  id serial primary key,
  number text not null unique,
  token text not null unique,
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
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on orders (status, expires_at);

create table if not exists order_items (
  id serial primary key,
  order_id integer not null references orders(id) on delete cascade,
  slug text not null,
  name text not null,
  size text not null,
  quantity integer not null,
  unit_price integer not null
);

create table if not exists waitlist (
  id serial primary key,
  slug text not null,
  size text not null,
  email text not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (slug, size, email)
);

-- Journal pseudonymise pour la limitation de debit (adresses hachees, purge automatique).
create table if not exists rate_events (
  id bigserial primary key,
  bucket text not null,
  key text not null,
  at timestamptz not null default now()
);

create index if not exists rate_events_idx on rate_events (bucket, key, at);

alter table orders add column if not exists refund_ref text;
alter table orders add column if not exists refunded_at timestamptz;

-- Contenu gere depuis l'admin. Une ligne remplace la valeur par defaut du code (meme slug).
create table if not exists products (
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

create table if not exists site_pages (
  slug text primary key,
  title text not null,
  intro text not null default '',
  content text not null default '',
  position integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value text not null
);

create table if not exists product_scenes (
  id bigserial primary key,
  slug text not null,
  position integer not null default 0,
  title text not null,
  caption text not null default '',
  image text not null,
  created_at timestamptz not null default now()
);

create index if not exists product_scenes_slug_idx on product_scenes (slug, position);
`;
