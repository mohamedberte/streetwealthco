import { settlePayment } from "@/server/payments";
import { isValidSignature } from "@/server/stripe";

export const dynamic = "force-dynamic";

/**
 * Webhook Stripe. À déclarer dans le tableau de bord Stripe (événement
 * checkout.session.completed) : https://<domaine>/api/stripe/webhook
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("stripe-signature"))) {
    return new Response("Signature invalide", { status: 401 });
  }

  let event: { type?: string; data?: { object?: { client_reference_id?: string } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Corps invalide", { status: 400 });
  }

  const reference = event.data?.object?.client_reference_id;
  if (
    (event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded") &&
    reference
  ) {
    try {
      await settlePayment(reference);
    } catch (error) {
      console.error("[webhook] traitement échoué", error);
      // 500 : Stripe retentera l'envoi.
      return new Response("Erreur", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}
