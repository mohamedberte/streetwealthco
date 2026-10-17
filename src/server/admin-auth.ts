import "server-only";
import { currentUser, isAdminUser } from "./auth";

/** Vrai si le visiteur est connecté avec un compte Supabase portant le rôle admin. */
export async function isAdmin() {
  return isAdminUser(await currentUser());
}
