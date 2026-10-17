import "server-only";
import { query, transaction } from "./db";
import { sendRestockEmail } from "./emails";

export async function addToWaitlist(slug: string, size: string, email: string) {
  await query(
    `insert into waitlist (slug, size, email) values ($1, $2, $3)
     on conflict (slug, size, email) do update set notified_at = null`,
    [slug, size, email.toLowerCase()],
  );
}

export type WaitlistEntry = {
  id: number;
  slug: string;
  size: string;
  email: string;
  created_at: Date;
  notified_at: Date | null;
};

export async function waitlistEntries() {
  return query<WaitlistEntry>(
    `select id, slug, size, email, created_at, notified_at from waitlist
      order by slug, size, created_at`,
  );
}

export async function removeWaitlistEntry(id: number) {
  await query(`delete from waitlist where id = $1`, [id]);
}

/** Désinscription par le client (lien signé dans l'e-mail). */
export async function unsubscribeFromWaitlist(slug: string, size: string, email: string) {
  await query(`delete from waitlist where slug = $1 and size = $2 and email = $3`, [
    slug,
    size,
    email.toLowerCase(),
  ]);
}

export async function waitlistCounts(): Promise<Record<string, number>> {
  const rows = await query<{ slug: string; size: string; n: number }>(
    `select slug, size, count(*)::int as n from waitlist where notified_at is null group by slug, size`,
  );
  return Object.fromEntries(rows.map((row) => [`${row.slug}:${row.size}`, row.n]));
}

/**
 * Prévient les personnes en attente (par ordre d'inscription), dans la limite
 * du stock disponible pour cette taille. À appeler après un réapprovisionnement.
 */
export async function notifyWaitlist(slug: string, size: string) {
  const emails = await transaction(async (q) => {
    const stock = await q.query<{ available: number }>(
      `select greatest(stock - reserved, 0)::int as available from inventory where slug = $1 and size = $2`,
      [slug, size],
    );
    const available = stock[0]?.available ?? 0;
    if (available <= 0) return [] as string[];

    const rows = await q.query<{ email: string }>(
      `update waitlist set notified_at = now()
        where id in (
          select id from waitlist
           where slug = $1 and size = $2 and notified_at is null
           order by created_at
           limit $3
        )
        returning email`,
      [slug, size, available],
    );
    return rows.map((row) => row.email);
  });

  await Promise.all(emails.map((email) => sendRestockEmail(email, slug, size)));
  return emails.length;
}
