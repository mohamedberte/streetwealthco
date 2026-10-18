import { INVOICEABLE, getInvoiceForOrder, getInvoicePdf, issueInvoice } from "@/server/invoices";
import { getOrderByToken } from "@/server/orders";
import { notFound, pdfResponse, rateLimited } from "@/server/pdf-response";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

/**
 * Facture (ou avoir avec ?type=avoir) d'une commande, protégée par le jeton de suivi
 * (non devinable) : le même lien que la page de suivi.
 */
export async function GET(request: Request, { params }: Context) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return notFound();
  const limited = await rateLimited("document");
  if (limited) return limited;

  const order = await getOrderByToken(token);
  if (!order) return notFound();

  const kind = new URL(request.url).searchParams.get("type") === "avoir" ? "credit_note" : "invoice";
  const existing = await getInvoiceForOrder(order.id, kind);
  if (existing) return pdfResponse(await getInvoicePdf(existing), `${existing.number}.pdf`);

  // Commande payée dont la facture n'a pas pu être émise au paiement : on l'émet à la demande.
  if (kind === "invoice" && INVOICEABLE.includes(order.status)) {
    try {
      const issued = await issueInvoice(order);
      return pdfResponse(issued.pdf, `${issued.number}.pdf`);
    } catch (error) {
      console.error("[invoice] émission à la demande impossible", error);
    }
  }
  return notFound();
}
