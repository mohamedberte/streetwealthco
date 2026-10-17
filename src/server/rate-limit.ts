import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { query } from "./db";

/** Empreinte (pseudonymisation) : aucune adresse IP ni e-mail n'est stocké en clair. */
export function hashKey(value: string) {
  return createHash("sha256")
    .update(`${value}|${process.env.ADMIN_SESSION_SECRET ?? "triplex"}`)
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
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from rate_events
      where bucket = $1 and key = $2 and at > now() - make_interval(secs => $3::int)`,
    [bucket, key, windowSeconds],
  );
  return (rows[0]?.n ?? 0) >= max;
}

export async function recordEvent(bucket: string, key: string) {
  await query(`insert into rate_events (bucket, key) values ($1, $2)`, [bucket, key]);
  // Purge occasionnelle des anciens événements.
  if (Math.random() < 0.02) {
    await query(`delete from rate_events where at < now() - interval '2 days'`);
  }
}
