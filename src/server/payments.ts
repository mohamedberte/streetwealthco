import "server-only";
import {
  sendAdminNotification,
  sendOrderConfirmation,
  sendRefundNeededNotification,
  type MailDocument,
} from "./emails";
import { BillingIncompleteError } from "./company";
import { INVOICEABLE, getInvoiceForOrder, issueInvoice } from "./invoices";
import { logOrderEvent } from "./order-events";
import { getOrderById, getOrderByNumber, markPaid, type PayResult } from "./orders";
import { verifySession } from "./stripe";

/** Reprend l'émission d'une facture manquante quand Stripe rejoue le webhook. */
async function ensureInvoice(orderId: number) {
  try {
    const order = await getOrderById(orderId);
    if (!order || !INVOICEABLE.includes(order.status)) return;
    if (await getInvoiceForOrder(order.id, "invoice")) return;
    await issueInvoice(order);
  } catch (error) {
    console.error("[invoice] reprise impossible", error);
  }
}

/**
 * Vérifie auprès de Stripe qu'une commande est payée, puis la confirme.
 * Utilisée par le webhook et par la page de suivi (retour client).
 * Idempotent : les e-mails ne partent qu'à la première confirmation.
 */
export async function settlePayment(number: string): Promise<PayResult | "unpaid"> {
  const existing = await getOrderByNumber(number);
  if (!existing?.payment_ref) return "unpaid";

  const verification = await verifySession(existing.payment_ref);
  if (!verification.paid) return "unpaid";

  const { result, orderId } = await markPaid(number, verification.amountEur);

  if (result === "mismatch") {
    console.error(
      `[stripe] montant inattendu pour ${number} : ${verification.amountEur} EUR (attendu : ${existing.total}).`,
    );
    return result;
  }

  if (result === "already" && orderId) await ensureInvoice(orderId);

  if ((result === "paid" || result === "refund_needed") && orderId) {
    const order = await getOrderById(orderId);
    if (order) {
      if (result === "paid") {
        await logOrderEvent(order.id, "paid");
        // Une facture manquante ne doit pas bloquer la confirmation : elle pourra être émise depuis l'admin.
        let invoice: MailDocument | null = null;
        let invoiceProblem: string | undefined;
        try {
          const issued = await issueInvoice(order);
          invoice = { number: issued.number, pdf: issued.pdf };
        } catch (error) {
          console.error(`[invoice] émission impossible pour ${order.number}`, error);
          invoiceProblem =
            error instanceof BillingIncompleteError
              ? "les informations de la société sont incomplètes (/admin/societe)"
              : "erreur technique (voir les journaux)";
          await logOrderEvent(order.id, "note", `Facture non émise : ${invoiceProblem}`);
        }
        // Chaque e-mail est indépendant : l'échec de l'un ne doit pas empêcher l'autre.
        const sent = await Promise.allSettled([
          sendOrderConfirmation(order, invoice),
          sendAdminNotification(order, invoiceProblem),
        ]);
        for (const outcome of sent) {
          if (outcome.status === "rejected") console.error("[mail] envoi impossible", outcome.reason);
        }
      } else {
        await logOrderEvent(order.id, "refund_needed", "Paiement reçu après épuisement du stock");
        await sendRefundNeededNotification(order);
      }
    }
  }
  return result;
}
