import "server-only";

type Attachment = { filename: string; content: Uint8Array };
type Mail = { to: string; subject: string; html: string; text?: string; attachments?: Attachment[] };

/** Version texte brut d'un e-mail HTML (certaines messageries et filtres anti-spam l'attendent). */
function htmlToText(html: string) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|h1|tr|div|table)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/td>\s*<td[^>]*>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Envoi via l'API REST Resend. Sans RESEND_API_KEY, le message est simplement
 * écrit dans la console (utile en développement). Un échec d'envoi ne doit
 * jamais bloquer une commande : l'erreur est journalisée.
 */
export async function sendMail({ to, subject, html, text, attachments }: Mail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "TRIPLEX <onboarding@resend.dev>";

  if (!key) {
    const files = attachments?.length ? ` (+${attachments.length} pièce jointe)` : "";
    // L'adresse du destinataire n'est jamais journalisée en production.
    const recipient = process.env.NODE_ENV === "production" ? "destinataire masqué" : to;
    console.log(`[mail:console] à ${recipient} — ${subject}${files}`);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text: text ?? htmlToText(html),
        attachments: attachments?.map((file) => ({
          filename: file.filename,
          content: Buffer.from(file.content).toString("base64"),
        })),
      }),
    });
    if (!response.ok) {
      // Le corps de l'erreur peut citer l'adresse du destinataire : on ne journalise que le statut.
      console.error("[mail] échec Resend", response.status);
    }
  } catch (error) {
    console.error("[mail] erreur réseau", error);
  }
}
