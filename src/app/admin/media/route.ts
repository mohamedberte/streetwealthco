import { revalidatePath } from "next/cache";
import { isAdmin } from "@/server/admin-auth";
import { getAnyProduct, setProductImage } from "@/server/catalog";
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

  let key: string;
  let back: string;
  if (target === "logo") {
    key = "logo";
    back = "/admin/contenu";
  } else if (target === "product" && /^[a-z0-9-]{1,80}$/.test(slug)) {
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

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("image_missing");
  if (file.size > MAX_IMAGE_BYTES) return fail("image_size");
  if (!isMediaConfigured()) return fail("image_storage");
  const data = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(data);
  if (!type) return fail("image_type");

  const previous = await currentUrl();
  let url: string;
  try {
    url = await uploadMedia(key, type, data);
  } catch (error) {
    console.error("Envoi d'image impossible", error);
    return fail("image_storage");
  }
  await apply(url);
  await deleteMediaByUrl(previous);
  revalidatePath("/", "layout");
  return done("image_saved");
}
