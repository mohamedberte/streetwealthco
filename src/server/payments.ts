import "server-only";
import { sendAdminNotification, sendOrderConfirmation, sendRefundNeededNotification } from "./emails";
import { getOrderById, getOrderByNumber, markPaid, type PayResult } from "./orders";
import { verifySession } from "./stripe";

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

  if ((result === "paid" || result === "refund_needed") && orderId) {
    const order = await getOrderById(orderId);
    if (order) {
      if (result === "paid") {
        await Promise.all([sendOrderConfirmation(order), sendAdminNotification(order)]);
      } else {
        await sendRefundNeededNotification(order);
      }
    }
  }
  return result;
}
