import "server-only";
import { clientKey, isLimited, recordEvent } from "./rate-limit";

/** 30 documents par minute et par visiteur : le jeton est long, mais chaque appel coûte un rendu ou une lecture S3. */
export async function rateLimited(bucket: string) {
  try {
    const key = await clientKey();
    if (await isLimited(bucket, key, 30, 60)) {
      return new Response("Trop de demandes", { status: 429, headers: { "Retry-After": "60" } });
    }
    await recordEvent(bucket, key);
  } catch (error) {
    console.error("[rate-limit] indisponible", error);
  }
  return null;
}

/** Réponse PDF privée : jamais mise en cache, jamais indexée, téléchargée sous un nom explicite. */
export function pdfResponse(pdf: Uint8Array, filename: string) {
  const safeName = filename.replace(/[^A-Za-z0-9._-]/g, "_");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const notFound = () => new Response("Introuvable", { status: 404 });
