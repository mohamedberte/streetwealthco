import "server-only";
import postgres from "postgres";
import { products } from "@/lib/products";
import { SCHEMA } from "./schema";

type Sql = ReturnType<typeof postgres>;

export type Row = Record<string, unknown>;

export interface Queryable {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

const g = globalThis as unknown as {
  __triplexSql?: Sql;
  __triplexReady?: Promise<void>;
};

function client(): Sql {
  if (!g.__triplexSql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL manquante : voir SETUP.md (section Base de données).");
    }
    g.__triplexSql = postgres(url, { max: 5, prepare: false });
  }
  return g.__triplexSql;
}

/** Crée les tables et initialise le stock manquant (sans écraser l'existant). */
async function bootstrap(sql: Sql) {
  await sql.unsafe(SCHEMA);

  const values: unknown[] = [];
  const tuples: string[] = [];
  for (const product of products) {
    for (const size of product.sizes) {
      values.push(product.slug, size, product.stockPerSize);
      const n = values.length;
      tuples.push(`($${n - 2}, $${n - 1}, $${n})`);
    }
  }
  await sql.unsafe(
    `insert into inventory (slug, size, stock) values ${tuples.join(", ")} on conflict do nothing`,
    values as never[],
  );
}

async function ready(): Promise<Sql> {
  const sql = client();
  if (!g.__triplexReady) {
    g.__triplexReady = bootstrap(sql).catch((error) => {
      g.__triplexReady = undefined;
      throw error;
    });
  }
  await g.__triplexReady;
  return sql;
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const sql = await ready();
  return (await sql.unsafe(text, params as never[])) as unknown as T[];
}

export async function transaction<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
  const sql = await ready();
  const result = await sql.begin(async (tx) => {
    const q: Queryable = {
      async query<R = Row>(text: string, params: unknown[] = []) {
        return (await tx.unsafe(text, params as never[])) as unknown as R[];
      },
    };
    return (await fn(q)) as never;
  });
  return result as unknown as T;
}
