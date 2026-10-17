import "server-only";
import { db, unwrap } from "./db";
import { sendRestockEmail } from "./emails";

export async function addToWaitlist(slug: string, size: string, email: string) {
  unwrap(
    await db()
      .from("waitlist")
      .upsert(
        { slug, size, email: email.toLowerCase(), notified_at: null },
        { onConflict: "slug,size,email" },
      ),
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

type WaitlistRow = Omit<WaitlistEntry, "created_at" | "notified_at"> & {
  created_at: string;
  notified_at: string | null;
};

export async function waitlistEntries(): Promise<WaitlistEntry[]> {
  const rows = unwrap<WaitlistRow[]>(
    await db()
      .from("waitlist")
      .select("id, slug, size, email, created_at, notified_at")
      .order("slug")
      .order("size")
      .order("created_at"),
  );
  return rows.map((row) => ({
    ...row,
    created_at: new Date(row.created_at),
    notified_at: row.notified_at ? new Date(row.notified_at) : null,
  }));
}

export async function removeWaitlistEntry(id: number) {
  unwrap(await db().from("waitlist").delete().eq("id", id));
}

/** Désinscription par le client (lien signé dans l'e-mail). */
export async function unsubscribeFromWaitlist(slug: string, size: string, email: string) {
  unwrap(
    await db()
      .from("waitlist")
      .delete()
      .eq("slug", slug)
      .eq("size", size)
      .eq("email", email.toLowerCase()),
  );
}

export async function waitlistCounts(): Promise<Record<string, number>> {
  const rows = unwrap<{ slug: string; size: string }[]>(
    await db().from("waitlist").select("slug, size").is("notified_at", null),
  );
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = `${row.slug}:${row.size}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/**
 * Prévient les personnes en attente (par ordre d'inscription), dans la limite
 * du stock disponible pour cette taille. À appeler après un réapprovisionnement.
 */
export async function notifyWaitlist(slug: string, size: string) {
  const emails = unwrap<string[] | null>(
    await db().rpc("notify_waitlist", { p_slug: slug, p_size: size }),
  ) ?? [];

  await Promise.all(emails.map((email) => sendRestockEmail(email, slug, size)));
  return emails.length;
}
