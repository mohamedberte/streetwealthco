import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur avec la clé service_role : il contourne le RLS et ne doit jamais
 * atteindre le navigateur. Toute action qui l'utilise doit avoir vérifié l'autorisation avant
 * (admin, propriétaire de la commande, jeton de suivi…).
 */
const g = globalThis as unknown as { __triplexDb?: SupabaseClient };

export function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function db(): SupabaseClient {
  if (!g.__triplexDb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase non configuré : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY manquantes (voir SETUP.md).",
      );
    }
    g.__triplexDb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return g.__triplexDb;
}

export class DbError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "DbError";
  }
}

/** Retourne `data` ou lève une `DbError` si Supabase a répondu par une erreur. */
export function unwrap<T>(result: {
  data: unknown;
  error: { message: string; code?: string } | null;
}): T {
  if (result.error) throw new DbError(result.error.message, result.error.code);
  return result.data as T;
}
