import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/ClearCart";
import { CodeLogin } from "@/components/CodeLogin";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/lib/brand";
import { carrierLabel, trackingUrl } from "@/lib/carriers";
import { formatPrice } from "@/lib/products";
import { countryName, policy, zones } from "@/lib/shipping";
import { formatCents, formatRate } from "@/lib/vat";
import { currentUser } from "@/server/auth";
import { supabaseConfigured } from "@/server/db";
import { getInvoiceForOrder } from "@/server/invoices";
import { firstEvent, listOrderEvents, publicEvents, type OrderEventType } from "@/server/order-events";
import { getOrderByToken, type OrderStatus } from "@/server/orders";
import { settlePayment } from "@/server/payments";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false } };

type Props = { params: Promise<{ token: string }> };

const STEPS: { status: OrderStatus; label: string; event: OrderEventType }[] = [
  { status: "confirmed", label: "Confirmée", event: "paid" },
  { status: "shipped", label: "Expédiée", event: "shipped" },
  { status: "delivered", label: "Livrée", event: "delivered" },
];

const dateFr = (value: Date) =>
  value.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });

const docLink =
  "inline-block border border-border px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] hover:border-brown";

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
  const offerAccount = order.payment_status === "paid" && supabaseConfigured() && !(await currentUser());

  const [events, invoice, creditNote] = await Promise.all([
    listOrderEvents(order.id),
    getInvoiceForOrder(order.id, "invoice"),
    getInvoiceForOrder(order.id, "credit_note"),
  ]);
  const visible = publicEvents(events);
  const hasInvoice = Boolean(invoice) || ["confirmed", "shipped", "delivered"].includes(order.status);
  const canReturn = order.status === "shipped" || order.status === "delivered";
  const deliveredAt = firstEvent(visible, "delivered")?.created_at;
  const withdrawalEnd = deliveredAt
    ? new Date(deliveredAt.getTime() + policy.withdrawalDays * 86_400_000)
    : null;
  const trackUrl = trackingUrl(order.carrier, order.tracking);
  const carrier = carrierLabel(order.carrier);

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
    headline = "Paiement reçu — remboursement en cours";
    message = `Votre paiement a bien été reçu, mais une pièce n'est plus disponible. Nous vous remboursons intégralement et vous prévenons par e-mail. Une question : ${brand.email}, avec votre numéro de commande.`;
  } else if (order.status === "refunded") {
    headline = "Commande remboursée";
    message =
      "Cette commande a été intégralement remboursée sur votre moyen de paiement d'origine (5 à 10 jours ouvrés selon votre banque).";
  } else if (order.status === "confirmed") {
    message = "Paiement reçu. Nous préparons votre commande.";
  }

  return (
    <PageShell>
      {order.payment_status === "paid" && <ClearCart />}

      <p className="text-[11px] uppercase tracking-[0.26em] text-gold">{order.number}</p>
      <h1 className="mt-3 break-words font-serif text-4xl leading-tight sm:text-5xl">{headline}</h1>
      {message && <p className="mt-5 text-sm leading-relaxed text-brown-soft">{message}</p>}

      {stepIndex >= 0 && (
        <ol className="mt-10 flex gap-2">
          {STEPS.map((step, i) => {
            const at = i <= stepIndex ? firstEvent(visible, step.event)?.created_at : undefined;
            return (
              <li key={step.status} className="flex-1">
                <div className={`h-px ${i <= stepIndex ? "bg-brown" : "bg-border"}`} />
                <p
                  className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${
                    i <= stepIndex ? "text-brown" : "text-muted"
                  }`}
                >
                  {step.label}
                </p>
                {at && <p className="mt-1 text-[11px] text-muted">{dateFr(at)}</p>}
              </li>
            );
          })}
        </ol>
      )}

      {(carrier || order.tracking) && (
        <p className="mt-6 text-sm text-brown-soft">
          Suivi de livraison{carrier ? ` (${carrier})` : ""} :{" "}
          {order.tracking &&
            (trackUrl ? (
              <a href={trackUrl} className="underline" target="_blank" rel="noopener noreferrer">
                {order.tracking}
              </a>
            ) : (
              order.tracking
            ))}
        </p>
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
            <span>Total TTC</span>
            <span>{formatPrice(order.total)}</span>
          </li>
          {invoice && (
            <li className="flex justify-between gap-4 text-xs text-muted">
              <span>
                dont TVA {formatRate(invoice.vat_rate)} ({countryName(invoice.country)})
              </span>
              <span>{formatCents(invoice.total_vat)}</span>
            </li>
          )}
        </ul>
      </section>

      {(hasInvoice || creditNote || canReturn) && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-[11px] uppercase tracking-[0.26em] text-gold">Documents</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {hasInvoice && (
              <a href={`/commande/${token}/facture`} className={docLink}>
                Facture{invoice ? ` ${invoice.number}` : ""} (PDF)
              </a>
            )}
            {creditNote && (
              <a href={`/commande/${token}/facture?type=avoir`} className={docLink}>
                Avoir {creditNote.number} (PDF)
              </a>
            )}
            {canReturn && (
              <a href={`/commande/${token}/retour`} className={docLink}>
                Bordereau de retour (PDF)
              </a>
            )}
          </div>
          {canReturn && (
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {withdrawalEnd
                ? `Vous pouvez vous rétracter jusqu'au ${dateFr(withdrawalEnd)}.`
                : `Vous disposez de ${policy.withdrawalDays} jours à compter de la réception pour vous rétracter.`}{" "}
              Le bordereau contient le formulaire de rétractation et l&apos;adresse de retour.
            </p>
          )}
        </section>
      )}

      {offerAccount && (
        <section className="mt-10 max-w-md border border-border bg-ivory p-5">
          <h2 className="text-[11px] uppercase tracking-[0.26em] text-gold">Créer mon compte</h2>
          <p className="mb-5 mt-3 text-sm leading-relaxed text-brown-soft">
            Sans mot de passe : un code envoyé par e-mail suffit. Vous retrouverez cette commande et les
            suivantes, et vos coordonnées seront pré-remplies.
          </p>
          <CodeLogin defaultEmail={order.email} next={`/commande/${token}`} autoSend />
        </section>
      )}

      <section className="mt-10 text-sm leading-relaxed text-brown-soft">
        <p>
          {order.name} · {order.phone}
          <br />
          {order.address}, {order.postal_code} {order.city}
          {order.country !== "FR" && `, ${countryName(order.country)}`}
        </p>
        <p className="mt-6">
          Une question ? <a className="underline" href={`mailto:${brand.email}`}>{brand.email}</a>
        </p>
      </section>
    </PageShell>
  );
}
