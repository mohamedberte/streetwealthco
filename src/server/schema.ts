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
`;
