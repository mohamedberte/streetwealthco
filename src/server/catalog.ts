import "server-only";
import { cache } from "react";
import { garmentKinds, products as defaults, type GarmentKind, type Product, type ProductScene } from "@/lib/products";
import { query, transaction, type Queryable } from "./db";

/**
 * Catalogue : les pièces par défaut sont dans src/lib/products.ts ; une ligne de la table
 * `products` (même slug) les remplace, et les pièces créées dans l'admin s'y ajoutent.
 * Une pièce n'est jamais supprimée : elle est archivée (`active = false`), car les commandes
 * y font référence.
 */
export type CatalogProduct = Product & {
  active: boolean;
  position: number;
  /** Vrai si la pièce existe (ou a été modifiée) en base. */
  fromDb: boolean;
};

type Row = {
  slug: string;
  position: number;
  name: string;
  word: string;
  silhouette: string;
  price: number;
  description: string;
  fabric: string;
  edition: string;
  sizes: string;
  stock_per_size: number;
  kind: string;
  tone_bg: string;
  tone_ink: string;
  tone_fill: string;
  tone_line: string;
  tone_accent: string | null;
  image: string | null;
  active: boolean;
};

type SceneRow = {
  id: number | string;
  slug: string;
  position: number;
  title: string;
  caption: string;
  image: string;
};

const defaultProducts: CatalogProduct[] = defaults.map((product, index) => ({
  ...product,
  active: true,
  position: (index + 1) * 10,
  fromDb: false,
}));

function fromRow(row: Row): CatalogProduct {
  return {
    slug: row.slug,
    name: row.name,
    word: row.word,
    silhouette: row.silhouette,
    price: Number(row.price),
    description: row.description,
    fabric: row.fabric,
    edition: row.edition,
    sizes: row.sizes
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean),
    stockPerSize: Number(row.stock_per_size),
    kind: (garmentKinds as string[]).includes(row.kind) ? (row.kind as GarmentKind) : "tee",
    tone: {
      bg: row.tone_bg,
      ink: row.tone_ink,
      fill: row.tone_fill,
      line: row.tone_line,
      ...(row.tone_accent ? { accent: row.tone_accent } : {}),
    },
    image: row.image ?? undefined,
    active: row.active,
    position: Number(row.position),
    fromDb: true,
  };
}

async function loadAll(): Promise<CatalogProduct[]> {
  let rows: Row[];
  let sceneRows: SceneRow[];
  try {
    rows = await query<Row>("select * from products");
    sceneRows = await query<SceneRow>(
      "select id, slug, position, title, caption, image from product_scenes order by position, id",
    );
  } catch (error) {
    console.warn("[catalog] base indisponible, catalogue par défaut utilisé :", error);
    return defaultProducts;
  }
  const scenes = new Map<string, ProductScene[]>();
  for (const row of sceneRows) {
    const list = scenes.get(row.slug) ?? [];
    list.push({
      id: Number(row.id),
      position: Number(row.position),
      title: row.title,
      caption: row.caption,
      image: row.image,
    });
    scenes.set(row.slug, list);
  }

  const merged = new Map(defaultProducts.map((product) => [product.slug, product]));
  for (const row of rows) merged.set(row.slug, fromRow(row));
  return [...merged.values()]
    .map((product) => ({ ...product, scenes: scenes.get(product.slug) ?? [] }))
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "fr"));
}

/** Toutes les pièces, archivées comprises (admin). Mémorisé le temps d'une requête. */
export const getAllProducts = cache(loadAll);

/** Pièces visibles et commandables. */
export async function getCatalog(): Promise<CatalogProduct[]> {
  return (await getAllProducts()).filter((product) => product.active);
}

export async function getProduct(slug: string): Promise<CatalogProduct | undefined> {
  return (await getCatalog()).find((product) => product.slug === slug);
}

/** Comme `getProduct`, mais inclut les pièces archivées (admin, e-mails). */
export async function getAnyProduct(slug: string): Promise<CatalogProduct | undefined> {
  return (await getAllProducts()).find((product) => product.slug === slug);
}

async function upsert(q: Queryable, product: CatalogProduct) {
  await q.query(
    `insert into products (slug, position, name, word, silhouette, price, description, fabric,
       edition, sizes, stock_per_size, kind, tone_bg, tone_ink, tone_fill, tone_line, tone_accent,
       image, active)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     on conflict (slug) do update set
       position = excluded.position, name = excluded.name, word = excluded.word,
       silhouette = excluded.silhouette, price = excluded.price,
       description = excluded.description, fabric = excluded.fabric, edition = excluded.edition,
       sizes = excluded.sizes, stock_per_size = excluded.stock_per_size, kind = excluded.kind,
       tone_bg = excluded.tone_bg, tone_ink = excluded.tone_ink, tone_fill = excluded.tone_fill,
       tone_line = excluded.tone_line, tone_accent = excluded.tone_accent,
       image = excluded.image, active = excluded.active, updated_at = now()`,
    [
      product.slug,
      product.position,
      product.name,
      product.word,
      product.silhouette,
      product.price,
      product.description,
      product.fabric,
      product.edition,
      product.sizes.join(","),
      product.stockPerSize,
      product.kind,
      product.tone.bg,
      product.tone.ink,
      product.tone.fill,
      product.tone.line,
      product.tone.accent ?? null,
      product.image ?? null,
      product.active,
    ],
  );
}

/** Crée les lignes de stock manquantes (stock initial) sans toucher à l'existant. */
async function ensureInventory(q: Queryable, product: CatalogProduct, initialStock: number) {
  for (const size of product.sizes) {
    await q.query(
      "insert into inventory (slug, size, stock) values ($1, $2, $3) on conflict do nothing",
      [product.slug, size, initialStock],
    );
  }
}

export type ProductFields = Omit<Product, "slug" | "image" | "scenes">;

/** Crée une pièce ; le stock initial par taille est `stockPerSize`. */
export async function createProduct(slug: string, fields: ProductFields, position: number) {
  const product: CatalogProduct = { ...fields, slug, position, active: true, fromDb: true };
  await transaction(async (q) => {
    await upsert(q, product);
    await ensureInventory(q, product, product.stockPerSize);
  });
}

/** Modifie une pièce existante (l'image et l'état archivé sont conservés). */
export async function updateProduct(slug: string, fields: ProductFields, position: number) {
  const current = await getAnyProduct(slug);
  if (!current) throw new Error("Pièce introuvable.");
  const product: CatalogProduct = { ...current, ...fields, slug, position, fromDb: true };
  await transaction(async (q) => {
    await upsert(q, product);
    // Nouvelles tailles : stock à 0 (à renseigner ensuite dans « Stock »).
    await ensureInventory(q, product, 0);
  });
}

export async function setProductActive(slug: string, active: boolean) {
  const current = await getAnyProduct(slug);
  if (!current) throw new Error("Pièce introuvable.");
  await transaction((q) => upsert(q, { ...current, active, fromDb: true }));
}

/** `image` = chemin local ou URL CloudFront ; `null` pour retirer. */
export async function setProductImage(slug: string, image: string | null) {
  const current = await getAnyProduct(slug);
  if (!current) throw new Error("Pièce introuvable.");
  await transaction((q) => upsert(q, { ...current, image: image ?? undefined, fromDb: true }));
}

export async function nextPosition() {
  const all = await getAllProducts();
  return all.reduce((max, product) => Math.max(max, product.position), 0) + 10;
}

/** Nombre maximal de scènes (looks) par pièce. */
export const MAX_SCENES = 8;

export type SceneFields = { title: string; caption: string };

/** Ajoute une scène en fin de liste ; renvoie false si la limite est atteinte. */
export async function addScene(slug: string, fields: SceneFields, image: string) {
  return transaction(async (q) => {
    const rows = await q.query<{ count: number | string; max: number | null }>(
      "select count(*)::int as count, coalesce(max(position), 0)::int as max from product_scenes where slug = $1",
      [slug],
    );
    if (Number(rows[0]?.count ?? 0) >= MAX_SCENES) return false;
    await q.query(
      "insert into product_scenes (slug, position, title, caption, image) values ($1, $2, $3, $4, $5)",
      [slug, Number(rows[0]?.max ?? 0) + 10, fields.title, fields.caption, image],
    );
    return true;
  });
}

export async function updateScene(id: number, fields: SceneFields, position: number) {
  await query("update product_scenes set title = $2, caption = $3, position = $4 where id = $1", [
    id,
    fields.title,
    fields.caption,
    position,
  ]);
}

/** Supprime une scène et renvoie son image (à retirer du stockage), ou null si introuvable. */
export async function deleteScene(id: number): Promise<{ slug: string; image: string } | null> {
  const rows = await query<{ slug: string; image: string }>(
    "delete from product_scenes where id = $1 returning slug, image",
    [id],
  );
  return rows[0] ?? null;
}

/** Texte -> identifiant d'URL (a-z, 0-9, tirets). */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Slug unique dérivé du nom. */
export async function uniqueSlug(name: string) {
  const base = slugify(name) || "piece";
  const taken = new Set((await getAllProducts()).map((product) => product.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i += 1) {
    if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}
