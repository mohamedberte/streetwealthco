import { isValidUnsubscribe } from "@/server/unsubscribe";
import { unsubscribeFromWaitlist } from "@/server/waitlist";

export const dynamic = "force-dynamic";

const page = (message: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TRIPLEX</title></head><body style="margin:0;padding:48px 24px;background:#E8D8C0;color:#24150F;font-family:Helvetica,Arial,sans-serif;text-align:center;"><p style="letter-spacing:6px;font-size:20px;">TRIPLEX</p><p style="font-size:15px;">${message}</p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

/** Lien de désinscription présent dans les e-mails de retour en stock. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const email = params.get("e") ?? "";
  const slug = params.get("p") ?? "";
  const size = params.get("s") ?? "";
  const token = params.get("t") ?? "";

  let valid = false;
  try {
    valid = Boolean(email && slug && size && token) && isValidUnsubscribe(email, slug, size, token);
  } catch {
    valid = false;
  }
  if (!valid) return page("Lien invalide ou expiré.", 400);

  await unsubscribeFromWaitlist(slug, size, email);
  return page("Vous êtes désinscrit(e) de cette alerte. Aucun autre e-mail ne vous sera envoyé pour cette pièce.");
}
