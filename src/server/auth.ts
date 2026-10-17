import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Clé publique (publishable) ; l'ancienne clé « anon » reste acceptée. */
export function publicKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * Client Supabase lié à la session (cookies) du visiteur : il sert uniquement à
 * l'authentification (connexion, déconnexion, lecture de l'utilisateur). Les données
 * passent par `db()` après vérification des droits.
 */
export async function sessionClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicKey();
  if (!url || !key) {
    throw new Error("Supabase non configuré : NEXT_PUBLIC_SUPABASE_URL et clé publique manquantes (voir SETUP.md).");
  }
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Appelé depuis un Server Component : le rafraîchissement est fait par proxy.ts.
        }
      },
    },
  });
}

/** Utilisateur connecté, vérifié auprès de Supabase Auth (jamais le simple contenu du cookie). */
export const currentUser = cache(async (): Promise<User | null> => {
  try {
    const { data, error } = await (await sessionClient()).auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
});

export function isAdminUser(user: User | null) {
  // `app_metadata` n'est modifiable que côté serveur (service_role) : le client ne peut pas se l'attribuer.
  return user?.app_metadata?.role === "admin";
}
