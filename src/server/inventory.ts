import "server-only";
import { products } from "@/lib/products";
import { query, transaction, type Queryable } from "./db";

export type Availability = Record<string, Record<string, number>>;
export type StockLine = { slug: string; size: string; quantity: number };

export class SoldOutError extends Error {
  constructor(
    public slug: string,
    public size: string,
  ) {
    super(`Indisponible : ${slug} (${size})`);
    this.name = "SoldOutError";
  }
}

/** Libère le stock réservé par les commandes en ligne dont le délai est dépassé. */
export async function releaseExpired(q: Queryable) {
  await q.query(
    `with expired as (
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
      where i.slug = s.slug and i.size = s.size`,
  );
}

export async function getAvailability(): Promise<Availability> {
  await transaction(releaseExpired);
  const rows = await query<{ slug: string; size: string; available: number }>(
    `select slug, size, greatest(stock - reserved, 0)::int as available from inventory`,
  );

  const result: Availability = {};
  for (const product of products) {
    result[product.slug] = {};
    for (const size of product.sizes) result[product.slug][size] = 0;
  }
  for (const row of rows) {
    if (result[row.slug] && row.size in result[row.slug]) {
      result[row.slug][row.size] = row.available;
    }
  }
  return result;
}

/**
 * Verrouille les lignes de stock (ordre stable, pour éviter les deadlocks) et
 * vérifie la disponibilité de toutes les lignes avant toute modification.
 */
async function lockAndCheck(q: Queryable, lines: StockLine[]) {
  const sorted = [...lines].sort((a, b) =>
    `${a.slug}:${a.size}`.localeCompare(`${b.slug}:${b.size}`),
  );
  for (const line of sorted) {
    const rows = await q.query<{ available: number }>(
      `select (stock - reserved)::int as available from inventory
        where slug = $1 and size = $2 for update`,
      [line.slug, line.size],
    );
    if (!rows[0] || rows[0].available < line.quantity) {
      throw new SoldOutError(line.slug, line.size);
    }
  }
}

/** Réserve le stock le temps du paiement en ligne (tout ou rien). */
export async function reserve(q: Queryable, lines: StockLine[]) {
  await lockAndCheck(q, lines);
  for (const line of lines) {
    await q.query(
      `update inventory set reserved = reserved + $3 where slug = $1 and size = $2`,
      [line.slug, line.size, line.quantity],
    );
  }
}

/** Décrémente le stock définitivement, sans réservation préalable (tout ou rien). */
export async function commitDirect(q: Queryable, lines: StockLine[]) {
  await lockAndCheck(q, lines);
  for (const line of lines) {
    await q.query(
      `update inventory set stock = stock - $3 where slug = $1 and size = $2`,
      [line.slug, line.size, line.quantity],
    );
  }
}

/** Transforme une réservation en vente. */
export async function commitReserved(q: Queryable, lines: StockLine[]) {
  for (const line of lines) {
    await q.query(
      `update inventory
          set stock = greatest(stock - $3, 0), reserved = greatest(reserved - $3, 0)
        where slug = $1 and size = $2`,
      [line.slug, line.size, line.quantity],
    );
  }
}

export async function releaseReserved(q: Queryable, lines: StockLine[]) {
  for (const line of lines) {
    await q.query(
      `update inventory set reserved = greatest(reserved - $3, 0)
        where slug = $1 and size = $2`,
      [line.slug, line.size, line.quantity],
    );
  }
}

export async function restock(q: Queryable, lines: StockLine[]) {
  for (const line of lines) {
    await q.query(
      `update inventory set stock = stock + $3 where slug = $1 and size = $2`,
      [line.slug, line.size, line.quantity],
    );
  }
}
