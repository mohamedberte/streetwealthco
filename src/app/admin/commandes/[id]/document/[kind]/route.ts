import { isAdmin } from "@/server/admin-auth";
import { packingSlipPdf, returnSlipPdf } from "@/server/documents";
import { getInvoiceForOrder, getInvoicePdf } from "@/server/invoices";
import { getOrderById } from "@/server/orders";
import { notFound, pdfResponse } from "@/server/pdf-response";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; kind: string }> };

/** Documents d'une commande pour l'admin : facture, avoir, bon de préparation, bordereau de retour. */
export async function GET(_request: Request, { params }: Context) {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });

  const { id: rawId, kind } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return notFound();
  const order = await getOrderById(id);
  if (!order) return notFound();

  if (kind === "preparation") return pdfResponse(await packingSlipPdf(order), `preparation-${order.number}.pdf`);
  if (kind === "retour") return pdfResponse(await returnSlipPdf(order), `retour-${order.number}.pdf`);

  if (kind === "facture" || kind === "avoir") {
    // Lecture seule : l'émission passe par le bouton de la page de commande, jamais par un GET.
    const row = await getInvoiceForOrder(order.id, kind === "avoir" ? "credit_note" : "invoice");
    if (!row) return notFound();
    return pdfResponse(await getInvoicePdf(row), `${row.number}.pdf`);
  }
  return notFound();
}
