import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db, unwrap } from "./db";

/** Empreinte (pseudonymisation) : aucune adresse IP ni e-mail n'est stocké en clair. */
export function hashKey(value: string) {
  return createHash("sha256")
    .update(`${value}|${process.env.APP_SECRET ?? "triplex"}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Identifiant pseudonymisé du visiteur. Sur Vercel, `x-forwarded-for` est
 * renseigné par la plateforme (et non par le client).
 */
export async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return hashKey(ip);
}

/** Vrai si `key` a déjà atteint `max` événements dans `bucket` sur la fenêtre donnée. */
export async function isLimited(bucket: string, key: string, max: number, windowSeconds: number) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const result = await db()
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("key", key)
    .gt("at", since);
  unwrap(result);
  return (result.count ?? 0) >= max;
}

export async function recordEvent(bucket: string, key: string) {
  unwrap(await db().from("rate_events").insert({ bucket, key }));
  // Purge occasionnelle des anciens événements.
  if (Math.random() < 0.02) {
    const cutoff = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
    unwrap(await db().from("rate_events").delete().lt("at", cutoff));
  }
}
