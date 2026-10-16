import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/ClearCart";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/products";
import { zones } from "@/lib/shipping";
import { getOrderByToken, type OrderStatus } from "@/server/orders";
import { settlePayment } from "@/server/payments";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false } };

type Props = { params: Promise<{ token: string }> };

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmée" },
  { status: "shipped", label: "Expédiée" },
  { status: "delivered", label: "Livrée" },
];

export default async function OrderPage({ params }: Props) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) notFound();

  let order = await getOrderByToken(token);
  if (!order) notFound();

  // Retour du paiement : on vérifie auprès de Stripe sans attendre le webhook.
  if (
    order.payment_status === "unpaid" &&
    (order.status === "pending_payment" || order.status === "expired")
  ) {
    try {
      await settlePayment(order.number);
      order = (await getOrderByToken(token)) ?? order;
    } catch (error) {
      console.error("[order] vérification du paiement impossible", error);
    }
  }

  const waitingPayment = order.status === "pending_payment";
  const expired = order.status === "expired";
  const cancelled = order.status === "cancelled";
  const refund = order.status === "refund_needed";
  const stepIndex = STEPS.findIndex((step) => step.status === order.status);

  let headline = `Commande ${order.number}`;
  let message = "";
  if (waitingPayment) {
    headline = "Paiement en attente";
    message =
      "Nous n'avons pas encore reçu la confirmation de votre paiement. Cette page se met à jour dès qu'elle arrive ; actualisez-la dans un instant.";
  } else if (expired) {
    headline = "Réservation expirée";
    message =
      "Le délai de paiement est dépassé et les pièces ont été remises à disposition. Vous pouvez recommencer depuis l'exposition.";
  } else if (cancelled) {
    headline = "Commande annulée";
    message = "Cette commande a été annulée.";
  } else if (refund) {
    headline = "Paiement reçu — vérification en cours";
    message = `Votre paiement a bien été reçu, mais une pièce n'est plus disponible. Nous vous remboursons intégralement : contactez-nous à ${brand.email} avec votre numéro de commande.`;
  } else if (order.status === "confirmed") {
    message = "Paiement reçu. Nous préparons votre commande.";
  }

  return (
    <PageShell>
      {order.payment_status === "paid" && <ClearCart />}

      <p className="text-[11px] uppercase tracking-[0.26em] text-gold">{order.number}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{headline}</h1>
      {message && <p className="mt-5 text-sm leading-relaxed text-brown-soft">{message}</p>}

      {stepIndex >= 0 && (
        <ol className="mt-10 flex gap-2">
          {STEPS.map((step, i) => (
            <li key={step.status} className="flex-1">
              <div className={`h-px ${i <= stepIndex ? "bg-brown" : "bg-border"}`} />
              <p
                className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${
                  i <= stepIndex ? "text-brown" : "text-muted"
                }`}
              >
                {step.label}
              </p>
            </li>
          ))}
        </ol>
      )}

      {order.tracking && (
        <p className="mt-6 text-sm text-brown-soft">Suivi de livraison : {order.tracking}</p>
      )}

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-[11px] uppercase tracking-[0.26em] text-gold">Détail</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {order.items.map((item) => (
            <li key={`${item.slug}-${item.size}`} className="flex justify-between gap-4">
              <span>
                {item.name} — {item.size} × {item.quantity}
              </span>
              <span>{formatPrice(item.unit_price * item.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4 text-brown-soft">
            <span>Livraison — {zones[order.zone].label}</span>
            <span>{formatPrice(order.shipping)}</span>
          </li>
          <li className="flex justify-between gap-4 border-t border-border pt-3 font-medium">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </li>
        </ul>
      </section>

      <section className="mt-10 text-sm leading-relaxed text-brown-soft">
        <p>
          {order.name} · {order.phone}
          <br />
          {order.address}, {order.postal_code} {order.city}
        </p>
        <p className="mt-6">
          Une question ? <a className="underline" href={`mailto:${brand.email}`}>{brand.email}</a>
        </p>
      </section>
    </PageShell>
  );
}
