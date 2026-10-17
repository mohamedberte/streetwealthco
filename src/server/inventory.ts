import "server-only";
import { products as defaults } from "@/lib/products";
import { getCatalog } from "./catalog";
import { db, unwrap } from "./db";

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

const g = globalThis as unknown as { __triplexSeed?: Promise<void> };

/** Crée le stock initial des pièces par défaut (sans écraser l'existant). Une fois par instance. */
export function ensureDefaultInventory(): Promise<void> {
  if (!g.__triplexSeed) {
    const rows = defaults.flatMap((product) =>
      product.sizes.map((size) => ({ slug: product.slug, size, stock: product.stockPerSize })),
    );
    g.__triplexSeed = Promise.resolve(
      db().from("inventory").upsert(rows, { onConflict: "slug,size", ignoreDuplicates: true }),
    )
      .then((result) => {
        unwrap(result);
      })
      .catch((error) => {
        g.__triplexSeed = undefined;
        throw error;
      });
  }
  return g.__triplexSeed;
}

/** Libère le stock réservé par les commandes en ligne dont le délai est dépassé. */
export async function releaseExpired() {
  unwrap(await db().rpc("release_expired"));
}

export async function getAvailability(): Promise<Availability> {
  await ensureDefaultInventory();
  await releaseExpired();
  const rows = unwrap<{ slug: string; size: string; stock: number; reserved: number }[]>(
    await db().from("inventory").select("slug, size, stock, reserved"),
  );

  const result: Availability = {};
  for (const product of await getCatalog()) {
    result[product.slug] = {};
    for (const size of product.sizes) result[product.slug][size] = 0;
  }
  for (const row of rows) {
    if (result[row.slug] && row.size in result[row.slug]) {
      result[row.slug][row.size] = Math.max(row.stock - row.reserved, 0);
    }
  }
  return result;
}
