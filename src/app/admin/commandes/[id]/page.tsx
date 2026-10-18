import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { carrierLabel, trackingUrl } from "@/lib/carriers";
import { formatPrice, toCents } from "@/lib/products";
import { countryName, zones } from "@/lib/shipping";
import { formatCents, formatRate, splitVat, vatRateFor } from "@/lib/vat";
import { isAdmin } from "@/server/admin-auth";
import { getBilling, invoiceMissingFields } from "@/server/company";
import { INVOICEABLE, getInvoiceForOrder } from "@/server/invoices";
import { listOrderEvents, type OrderEventType } from "@/server/order-events";
import { getOrderById } from "@/server/orders";
import { addOrderNoteAction, cancelOrderAction, issueCreditNoteAction, issueInvoiceAction } from "../../actions";
import { AdminTitle, Banner } from "../../AdminHeader";
import { btn, card, input, label, sectionTitle } from "../../ui";
import { REFUNDABLE, Refund, STATUS, ShipForms, dateFr, dateTimeFr } from "../OrderForms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration — Commande",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const EVENT_LABEL: Record<OrderEventType, string> = {
  created: "Commande créée",
  paid: "Paiement confirmé",
  refund_needed: "Remboursement à effectuer",
  invoice: "Facture émise",
  credit_note: "Avoir émis",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  note: "Note interne",
};

const ACTOR: Record<string, string> = { system: "Système", admin: "Admin", client: "Client" };

const docLink =
  "border border-border px-3 py-2 text-[10px] uppercase tracking-[0.18em] hover:border-brown";

export default async function OrderDetailPage({ params, searchParams }: Props) {
  if (!(await isAdmin())) redirect("/admin");
  const { id: rawId } = await params;
  const query = await searchParams;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const order = await getOrderById(id);
  if (!order) notFound();

  const [events, invoice, creditNote, billing] = await Promise.all([
    listOrderEvents(order.id),
    getInvoiceForOrder(order.id, "invoice"),
    getInvoiceForOrder(order.id, "credit_note"),
    getBilling(),
  ]);

  const rate = invoice?.vat_rate ?? vatRateFor(order.country, billing.invoice.vatMode);
  const vat = invoice
    ? { ht: invoice.total_ht, vat: invoice.total_vat }
    : (() => {
        const split = splitVat(toCents(order.total), rate);
        return { ht: split.ht, vat: split.vat };
      })();

  const paid = order.payment_status === "paid";
  const canInvoice = paid && !invoice && INVOICEABLE.includes(order.status);
  const canCreditNote = order.status === "refunded" && Boolean(invoice) && !creditNote;
  const companyMissing = invoiceMissingFields(billing.company);
  const canRefund = REFUNDABLE.includes(order.status) && Boolean(order.payment_ref);
  const url = trackingUrl(order.carrier, order.tracking);
  const base = `/admin/commandes/${order.id}/document`;

  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
        <Link href="/admin/commandes" className="hover:text-brown">
          ← Commandes
        </Link>
      </p>
      <div className="mt-4">
        <AdminTitle title={order.number} />
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-gold">
          {STATUS[order.status]} · {dateTimeFr(order.created_at)}
        </p>
      </div>
      <Banner notice={one(query.notice)} error={one(query.error)} field={one(query.field)} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className={`p-5 sm:p-6 ${card}`}>
            <h2 className={sectionTitle}>Articles</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={`${item.slug}-${item.size}`} className="flex justify-between gap-4">
                  <span>
                    {item.name} · {item.size} × {item.quantity}
                  </span>
                  <span className="text-brown-soft">{formatPrice(item.unit_price * item.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-4 text-brown-soft">
                <span>Livraison · {zones[order.zone].label}</span>
                <span>{formatPrice(order.shipping)}</span>
              </li>
              <li className="flex justify-between gap-4 border-t border-border pt-3 font-medium">
                <span>Total TTC</span>
                <span>{formatPrice(order.total)}</span>
              </li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {invoice ? "Selon la facture" : "Estimation"} : {formatCents(vat.ht)} HT + {formatCents(vat.vat)} de TVA à{" "}
              {formatRate(rate)} ({countryName(invoice?.country ?? order.country)}).
            </p>
          </section>

          {(order.status === "confirmed" || order.status === "shipped") && (
            <section className={`p-5 sm:p-6 ${card}`}>
              <h2 className={sectionTitle}>Expédition</h2>
              <div className="mt-4">
                <ShipForms order={order} />
              </div>
            </section>
          )}

          <section className={`p-5 sm:p-6 ${card}`}>
            <h2 className={sectionTitle}>Historique</h2>
            {events.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Aucun événement enregistré.</p>
            ) : (
              <ol className="mt-4 space-y-3 text-sm">
                {events.map((event) => (
                  <li key={event.id} className="grid grid-cols-[8.5rem_1fr] gap-3">
                    <span className="text-xs text-muted">{dateTimeFr(event.created_at)}</span>
                    <span>
                      <span className={event.type === "note" ? "text-gold" : undefined}>{EVENT_LABEL[event.type]}</span>
                      {event.detail && <span className="text-brown-soft"> — {event.detail}</span>}
                      <span className="text-xs text-muted"> · {ACTOR[event.actor]}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <form action={addOrderNoteAction} className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              <input type="hidden" name="id" value={order.id} />
              <label htmlFor="note" className="sr-only">
                Note interne
              </label>
              <input
                id="note"
                name="note"
                required
                maxLength={500}
                placeholder="Note interne (jamais visible par le client)"
                className={`${input} min-w-48 flex-1`}
              />
              <button type="submit" className={btn}>
                Ajouter
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className={`p-5 sm:p-6 ${card}`}>
            <h2 className={sectionTitle}>Client</h2>
            <p className="mt-4 text-sm leading-relaxed">
              {order.name}
              <br />
              <a className="underline" href={`mailto:${order.email}`}>
                {order.email}
              </a>
              <br />
              {order.phone}
            </p>
            <p className={`mt-5 ${label}`}>Livraison</p>
            <p className="mt-1 text-sm leading-relaxed text-brown-soft">
              {order.address}
              <br />
              {order.postal_code} {order.city}
              <br />
              {countryName(order.country)}
            </p>
            {order.notes && <p className="mt-3 text-sm text-muted">« {order.notes} »</p>}
            {(order.carrier || order.tracking) && (
              <p className="mt-4 text-sm text-brown-soft">
                {carrierLabel(order.carrier)}
                {order.tracking &&
                  (url ? (
                    <>
                      {" "}
                      ·{" "}
                      <a href={url} className="underline" target="_blank" rel="noopener noreferrer">
                        {order.tracking}
                      </a>
                    </>
                  ) : (
                    ` · ${order.tracking}`
                  ))}
              </p>
            )}
          </section>

          <section className={`p-5 sm:p-6 ${card}`}>
            <h2 className={sectionTitle}>Documents</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {invoice && (
                <a href={`${base}/facture`} className={docLink}>
                  Facture {invoice.number}
                </a>
              )}
              {creditNote && (
                <a href={`${base}/avoir`} className={docLink}>
                  Avoir {creditNote.number}
                </a>
              )}
              {paid && (
                <a href={`${base}/preparation`} className={docLink}>
                  Bon de préparation
                </a>
              )}
              {paid && (
                <a href={`${base}/retour`} className={docLink}>
                  Bordereau de retour
                </a>
              )}
            </div>
            {canInvoice && (
              <form action={issueInvoiceAction} className="mt-4">
                <input type="hidden" name="id" value={order.id} />
                {companyMissing.length > 0 && (
                  <p className="mb-3 text-xs leading-relaxed text-gold">
                    Les informations de la société sont incomplètes : complétez-les dans{" "}
                    <Link href="/admin/societe" className="underline">
                      Société et factures
                    </Link>{" "}
                    avant d&apos;émettre la facture.
                  </p>
                )}
                <button type="submit" className={btn}>
                  Émettre la facture
                </button>
              </form>
            )}
            {canCreditNote && (
              <form action={issueCreditNoteAction} className="mt-4">
                <input type="hidden" name="id" value={order.id} />
                <button type="submit" className={btn}>
                  Émettre l&apos;avoir
                </button>
              </form>
            )}
            {!paid && <p className="mt-3 text-xs text-muted">Les documents sont disponibles une fois la commande payée.</p>}
            {invoice && (
              <p className="mt-3 text-xs text-muted">
                Facture émise le {dateFr(invoice.issued_at)}
                {invoice.pdf_key ? " · archivée dans S3" : " · non archivée dans S3"}.
              </p>
            )}
          </section>

          {(order.status === "pending_payment" || canRefund) && (
            <section className={`p-5 sm:p-6 ${card}`}>
              <h2 className={sectionTitle}>Actions</h2>
              {order.status === "pending_payment" && (
                <form action={cancelOrderAction} className="mt-4">
                  <input type="hidden" name="id" value={order.id} />
                  <button type="submit" className={btn}>
                    Annuler la commande
                  </button>
                </form>
              )}
              {canRefund && (
                <div className="mt-4">
                  <Refund order={order} />
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
