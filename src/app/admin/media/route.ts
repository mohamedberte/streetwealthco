import { revalidatePath } from "next/cache";
import { isAdmin } from "@/server/admin-auth";
import { addScene, deleteScene, getAnyProduct, setProductImage } from "@/server/catalog";
import { getSettings, setSetting } from "@/server/content";
import {
  deleteMediaByUrl,
  isMediaConfigured,
  MAX_IMAGE_BYTES,
  sniffImage,
  uploadMedia,
} from "@/server/media";

export const dynamic = "force-dynamic";

const redirectTo = (path: string) =>
  new Response(null, { status: 303, headers: { Location: path } });

const SLUG = /^[a-z0-9-]{1,80}$/;

/** Lit, contrôle (taille, vrai format) et envoie l'image du formulaire ; renvoie l'URL ou un code d'erreur. */
async function uploadFromForm(
  form: FormData,
  key: string,
): Promise<{ url: string } | { error: string }> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "image_missing" };
  if (file.size > MAX_IMAGE_BYTES) return { error: "image_size" };
  if (!isMediaConfigured()) return { error: "image_storage" };
  const data = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(data);
  if (!type) return { error: "image_type" };
  try {
    return { url: await uploadMedia(key, type, data) };
  } catch (error) {
    console.error("Envoi d'image impossible", error);
    return { error: "image_storage" };
  }
}

/** Scènes (looks) d'une pièce : ajout avec titre et légende, ou retrait. */
async function handleScene(form: FormData, slug: string, operation: FormDataEntryValue | null) {
  const anchor = SLUG.test(slug) ? `#p-${slug}` : "";
  const done = (code: string) => redirectTo(`/admin/produits?notice=${code}${anchor}`);
  const fail = (code: string) => redirectTo(`/admin/produits?error=${code}${anchor}`);

  if (operation === "remove") {
    const id = Number(form.get("sceneId"));
    if (!Number.isInteger(id) || id <= 0) return new Response("Requête invalide", { status: 400 });
    const removed = await deleteScene(id);
    if (!removed) return fail("unknown");
    await deleteMediaByUrl(removed.image);
    revalidatePath("/", "layout");
    return redirectTo(`/admin/produits?notice=scene_removed#p-${removed.slug}`);
  }

  if (!SLUG.test(slug) || !(await getAnyProduct(slug))) return fail("unknown");
  const title = String(form.get("title") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();
  if (title.length < 2 || title.length > 60 || caption.length > 200) return fail("scene_text");

  const uploaded = await uploadFromForm(form, `scene-${slug}`);
  if ("error" in uploaded) return fail(uploaded.error);

  const added = await addScene(slug, { title, caption }, uploaded.url);
  if (!added) {
    await deleteMediaByUrl(uploaded.url);
    return fail("scene_limit");
  }
  revalidatePath("/", "layout");
  return done("scene_added");
}

/**
 * Envoi / retrait d'une image (pièce ou logo). Sous /admin pour recevoir le cookie de session.
 * Protégé par la session admin, par SameSite=Strict et par un contrôle de l'en-tête Origin.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin && host && new URL(origin).host === host);
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return new Response("Origine refusée", { status: 403 });

  const form = await request.formData();
  const target = form.get("target");
  const operation = form.get("operation");
  const slug = String(form.get("slug") ?? "");

  if (target === "scene") return handleScene(form, slug, operation);

  let key: string;
  let back: string;
  if (target === "logo") {
    key = "logo";
    back = "/admin/contenu";
  } else if (target === "product" && SLUG.test(slug)) {
    key = `product-${slug}`;
    back = "/admin/produits";
  } else {
    return new Response("Requête invalide", { status: 400 });
  }
  const done = (code: string) => redirectTo(`${back}?notice=${code}`);
  const fail = (code: string) => redirectTo(`${back}?error=${code}`);

  const apply = async (url: string | null) => {
    if (target === "logo") await setSetting("logo_url", url);
    else await setProductImage(slug, url);
  };
  const currentUrl = async () =>
    target === "logo" ? (await getSettings()).logoUrl : ((await getAnyProduct(slug))?.image ?? null);

  if (operation === "remove") {
    const previous = await currentUrl();
    await apply(null);
    await deleteMediaByUrl(previous);
    revalidatePath("/", "layout");
    return done("image_removed");
  }

  const previous = await currentUrl();
  const uploaded = await uploadFromForm(form, key);
  if ("error" in uploaded) return fail(uploaded.error);
  await apply(uploaded.url);
  await deleteMediaByUrl(previous);
  revalidatePath("/", "layout");
  return done("image_saved");
}
