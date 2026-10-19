"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { garmentKinds, roundMoney, type GarmentKind } from "@/lib/products";
import { parisLocalToIso } from "@/lib/paris";
import { isAdmin } from "@/server/admin-auth";
import {
  createProduct,
  getAnyProduct,
  nextPosition,
  setProductActive,
  slugify,
  uniqueSlug,
  updateProduct,
  updateScene,
  type ProductFields,
} from "@/server/catalog";
import {
  deletePageRow,
  getAllPages,
  nextPagePosition,
  savePage,
  setSetting,
} from "@/server/content";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const SLUG = /^[a-z0-9-]{1,80}$/;
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const productSchema = z.object({
  name: z.string().trim().min(2).max(80),
  word: z.string().trim().min(1).max(24),
  silhouette: z.string().trim().min(1).max(40),
  price: z.coerce.number().min(0).max(10_000).transform(roundMoney),
  description: z.string().trim().max(600),
  fabric: z.string().trim().max(80),
  edition: z.string().trim().max(40),
  sizes: z
    .string()
    .max(160)
    .transform((value) =>
      [...new Set(value.split(",").map((size) => size.trim()).filter(Boolean))],
    )
    .pipe(z.array(z.string().regex(/^[A-Za-z0-9+. -]{1,12}$/)).min(1).max(12)),
  stockPerSize: z.coerce.number().int().min(0).max(10_000).optional(),
  kind: z.enum(garmentKinds as [GarmentKind, ...GarmentKind[]]),
  bg: hex,
  ink: hex,
  fill: hex,
  line: hex,
  accent: hex,
  position: z.coerce.number().int().min(0).max(100_000).optional(),
});

function parseProduct(formData: FormData, create: boolean) {
  const raw = Object.fromEntries(
    [
      "name",
      "word",
      "silhouette",
      "price",
      "description",
      "fabric",
      "edition",
      "sizes",
      "kind",
      "bg",
      "ink",
      "fill",
      "line",
      "accent",
    ].map((name) => [name, text(formData, name)]),
  );
  const position = text(formData, "position").trim();
  // Le stock initial n'existe qu'à la création ; ensuite, il se gère par taille.
  const stock = create ? text(formData, "stockPerSize").trim() : "";
  const parsed = productSchema.safeParse({
    ...raw,
    position: position === "" ? undefined : position,
    stockPerSize: create ? stock : undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, field: String(parsed.error.issues[0]?.path[0] ?? "form") };
  }
  const data = parsed.data;
  if (create && data.stockPerSize === undefined) return { ok: false as const, field: "stockPerSize" };
  if (!create && data.edition === "") return { ok: false as const, field: "edition" };
  // Ouverture programmée (heure de Paris) ; vide = en vente immédiatement.
  const opensLocal = text(formData, "opensAt").trim();
  const opensAt = opensLocal ? parisLocalToIso(opensLocal) : undefined;
  if (opensAt === null) return { ok: false as const, field: "opensAt" };
  const stockPerSize = data.stockPerSize ?? 0;
  const fields: ProductFields = {
    name: data.name,
    word: data.word.toUpperCase(),
    silhouette: data.silhouette,
    price: data.price,
    description: data.description,
    fabric: data.fabric,
    // Édition laissée vide à la création : calculée d'après le stock initial, pour rester cohérente.
    edition: data.edition || `${stockPerSize * data.sizes.length} pièces`,
    sizes: data.sizes,
    stockPerSize,
    opensAt,
    kind: data.kind,
    tone: {
      bg: data.bg,
      ink: data.ink,
      fill: data.fill,
      line: data.line,
      ...(formData.get("useAccent") === "yes" ? { accent: data.accent } : {}),
    },
  };
  return { ok: true as const, fields, position: data.position };
}

/** Crée (mode=create) ou modifie une pièce. */
export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  const create = formData.get("mode") === "create";
  const parsed = parseProduct(formData, create);
  if (!parsed.ok) redirect(`/admin/produits?error=invalid&field=${parsed.field}`);

  let slug: string;
  if (create) {
    slug = await uniqueSlug(parsed.fields.name);
    await createProduct(slug, parsed.fields, parsed.position ?? (await nextPosition()));
  } else {
    slug = text(formData, "slug");
    const current = SLUG.test(slug) ? await getAnyProduct(slug) : undefined;
    if (!current) redirect("/admin/produits?error=unknown");
    await updateProduct(slug, parsed.fields, parsed.position ?? current.position);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/produits?notice=${create ? "created" : "saved"}#p-${slug}`);
}

/** Archive (visible = no) ou restaure (visible = yes) une pièce. */
export async function setProductActiveAction(formData: FormData) {
  await requireAdmin();
  const slug = text(formData, "slug");
  if (!SLUG.test(slug) || !(await getAnyProduct(slug))) return;
  await setProductActive(slug, formData.get("active") === "yes");
  revalidatePath("/", "layout");
  redirect(`/admin/produits?notice=saved#p-${slug}`);
}

const sceneSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().trim().min(2).max(60),
  caption: z.string().trim().max(200),
  position: z.coerce.number().int().min(0).max(100_000),
});

/** Modifie le titre, la légende et l'ordre d'une scène (looks). */
export async function updateSceneAction(formData: FormData) {
  await requireAdmin();
  const slug = text(formData, "slug");
  const anchor = SLUG.test(slug) ? `#p-${slug}` : "";
  const parsed = sceneSchema.safeParse({
    id: text(formData, "sceneId"),
    title: text(formData, "title"),
    caption: text(formData, "caption"),
    position: text(formData, "position"),
  });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "form");
    redirect(`/admin/produits?error=invalid&field=${field === "id" ? "form" : field}${anchor}`);
  }
  const { id, title, caption, position } = parsed.data;
  await updateScene(id, { title, caption }, position);
  revalidatePath("/", "layout");
  redirect(`/admin/produits?notice=saved${anchor}`);
}

const pageSchema = z.object({
  title: z.string().trim().min(2).max(100),
  intro: z.string().trim().max(800),
  content: z.string().max(20_000),
  position: z.coerce.number().int().min(0).max(100_000).optional(),
});

/** Crée (mode=create) ou modifie une page d'information. */
export async function savePageAction(formData: FormData) {
  await requireAdmin();
  const create = formData.get("mode") === "create";
  const position = text(formData, "position").trim();
  const parsed = pageSchema.safeParse({
    title: text(formData, "title"),
    intro: text(formData, "intro"),
    content: text(formData, "content").replace(/\r/g, ""),
    position: position === "" ? undefined : position,
  });
  if (!parsed.success) {
    redirect(`/admin/contenu?error=invalid&field=${String(parsed.error.issues[0]?.path[0] ?? "form")}`);
  }

  const pages = await getAllPages();
  let slug: string;
  if (create) {
    const base = slugify(parsed.data.title) || "page";
    const taken = new Set(pages.map((page) => page.slug));
    slug = base;
    for (let i = 2; taken.has(slug) && i < 100; i += 1) slug = `${base}-${i}`;
    if (taken.has(slug)) redirect("/admin/contenu?error=unknown");
  } else {
    slug = text(formData, "slug");
    if (!SLUG.test(slug) || !pages.some((page) => page.slug === slug)) {
      redirect("/admin/contenu?error=unknown");
    }
  }

  await savePage({
    slug,
    title: parsed.data.title,
    intro: parsed.data.intro,
    content: parsed.data.content,
    position: parsed.data.position ?? (await nextPagePosition()),
    active: create || formData.get("active") === "yes",
  });
  revalidatePath("/", "layout");
  redirect(`/admin/contenu?notice=${create ? "created" : "saved"}#pg-${slug}`);
}

/** Page par défaut : restaure le texte d'origine. Page créée : la supprime. */
export async function resetPageAction(formData: FormData) {
  await requireAdmin();
  const slug = text(formData, "slug");
  if (!SLUG.test(slug) || formData.get("confirm") !== "yes") return;
  await deletePageRow(slug);
  revalidatePath("/", "layout");
  redirect("/admin/contenu?notice=reset");
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const tagline = text(formData, "tagline").trim();
  if (tagline.length > 160) redirect("/admin/contenu?error=invalid&field=tagline");
  await setSetting("tagline", tagline || null);
  revalidatePath("/", "layout");
  redirect("/admin/contenu?notice=saved");
}
