import "server-only";

type Mail = { to: string; subject: string; html: string };

/**
 * Envoi via l'API REST Resend. Sans RESEND_API_KEY, le message est simplement
 * écrit dans la console (utile en développement). Un échec d'envoi ne doit
 * jamais bloquer une commande : l'erreur est journalisée.
 */
export async function sendMail({ to, subject, html }: Mail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "TRIPLEX <onboarding@resend.dev>";

  if (!key) {
    console.log(`[mail:console] à ${to} — ${subject}`);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!response.ok) {
      console.error("[mail] échec Resend", response.status, await response.text());
    }
  } catch (error) {
    console.error("[mail] erreur réseau", error);
  }
}
