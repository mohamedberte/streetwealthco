import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.stripe.com/v1";

function secret() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquante : voir SETUP.md (section Stripe).");
  return key;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

const cents = (euros: number) => Math.round(euros * 100);

type CheckoutLine = { name: string; quantity: number; unitPrice: number };

/** Crée une session Stripe Checkout (page de paiement hébergée par Stripe). */
export async function createCheckoutSession(params: {
  number: string;
  email: string;
  lines: CheckoutLine[];
  successUrl: string;
  cancelUrl: string;
  expiresInMinutes: number;
}) {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("client_reference_id", params.number);
  body.set("customer_email", params.email);
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("metadata[order]", params.number);
  // Stripe impose 30 minutes minimum ; 1 minute de marge.
  body.set(
    "expires_at",
    String(Math.floor(Date.now() / 1000) + (params.expiresInMinutes + 1) * 60),
  );

  params.lines.forEach((line, i) => {
    body.set(`line_items[${i}][quantity]`, String(line.quantity));
    body.set(`line_items[${i}][price_data][currency]`, "eur");
    body.set(`line_items[${i}][price_data][unit_amount]`, String(cents(line.unitPrice)));
    body.set(`line_items[${i}][price_data][product_data][name]`, line.name);
  });

  const response = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `order-${params.number}`,
    },
    body,
  });
  const json = (await response.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !json.id || !json.url) {
    throw new Error(json.error?.message ?? "Création de la session de paiement impossible.");
  }
  return { id: json.id, url: json.url };
}

export type Verification = { paid: boolean; amountEur: number };

/**
 * Rembourse intégralement le paiement d'une session Checkout. Idempotent côté
 * Stripe (clé d'idempotence par commande). Retourne l'identifiant du remboursement.
 */
export async function refundPayment(sessionId: string, number: string) {
  const sessionResponse = await fetch(`${API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const session = (await sessionResponse.json()) as {
    payment_intent?: string | null;
    error?: { message?: string };
  };
  if (!sessionResponse.ok || !session.payment_intent) {
    throw new Error(session.error?.message ?? "Paiement introuvable chez Stripe.");
  }

  const body = new URLSearchParams();
  body.set("payment_intent", session.payment_intent);
  body.set("reason", "requested_by_customer");
  body.set("metadata[order]", number);

  const response = await fetch(`${API}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `refund-${number}`,
    },
    body,
  });
  const json = (await response.json()) as {
    id?: string;
    error?: { message?: string; code?: string };
  };
  // Déjà remboursé (par exemple depuis le tableau de bord Stripe) : on réconcilie.
  if (json.error?.code === "charge_already_refunded") return "deja_rembourse";
  if (!response.ok || !json.id) {
    throw new Error(json.error?.message ?? "Remboursement impossible.");
  }
  return json.id;
}

export async function verifySession(sessionId: string): Promise<Verification> {
  const response = await fetch(`${API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  if (!response.ok) return { paid: false, amountEur: 0 };
  const json = (await response.json()) as {
    payment_status?: string;
    amount_total?: number;
    currency?: string;
  };
  return {
    paid: json.payment_status === "paid" && json.currency === "eur",
    amountEur: (json.amount_total ?? 0) / 100,
  };
}

/**
 * Signature du webhook : en-tête `Stripe-Signature: t=<horodatage>,v1=<signature>`,
 * avec v1 = HMAC-SHA256 de `<t>.<corps brut>` par le secret `whsec_…`.
 */
export function isValidSignature(rawBody: string, header: string | null) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!header || !webhookSecret) return false;

  const parts = header.split(",").map((part) => part.split("=") as [string, string]);
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected);
  return signatures.some((signature) => {
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
