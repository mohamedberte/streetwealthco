import { notFound } from "next/navigation";
import { productCard } from "@/lib/og";
import { getProduct } from "@/server/catalog";
import { siteUrl } from "@/server/emails";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/** Photo de la pièce en data URI (PNG ou JPEG uniquement). Toute erreur => aperçu sans photo. */
async function loadPhoto(image: string | undefined) {
  if (!image) return null;
  try {
    const url = new URL(image, siteUrl());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!res.ok || (type !== "image/png" && type !== "image/jpeg")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_PHOTO_BYTES) return null;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Aperçu de partage d'une pièce : /og/<slug> (image PNG 1200 × 630). */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return productCard(product, await loadPhoto(product.image));
}
