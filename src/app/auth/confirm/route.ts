import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { sessionClient } from "@/server/auth";

export const dynamic = "force-dynamic";

const TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/** Redirection interne uniquement (jamais vers un autre domaine). */
function safeNext(value: string | null) {
  return value && /^\/(?!\/)[\w\-./]*$/.test(value) ? value : "/compte";
}

/**
 * Cible des liens des e-mails Supabase Auth (confirmation d'inscription, mot de passe oublié) :
 * /auth/confirm?token_hash=...&type=...&next=/compte (voir SETUP.md pour les modèles d'e-mail).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await sessionClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(type === "recovery" ? "/compte/mot-de-passe" : next, origin));
    }
  }
  return NextResponse.redirect(new URL("/compte?m=lien", origin));
}
