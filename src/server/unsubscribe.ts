import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.APP_SECRET;
  if (!value || value.length < 32) throw new Error("APP_SECRET manquante ou trop courte (32 caractères minimum).");
  return value;
}

/** Jeton signé pour le lien de désinscription de la liste d'attente. */
export function unsubscribeToken(email: string, slug: string, size: string) {
  return createHmac("sha256", secret())
    .update(`unsub|${email.toLowerCase()}|${slug}|${size}`)
    .digest("base64url");
}

export function isValidUnsubscribe(email: string, slug: string, size: string, token: string) {
  const a = Buffer.from(unsubscribeToken(email, slug, size));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
