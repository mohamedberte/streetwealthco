import { carriers, carrierIds } from "@/lib/carriers";
import { formatPrice } from "@/lib/products";
import type { Order, OrderStatus } from "@/server/orders";
import { deliverOrder, refundOrderAction, shipOrder } from "../actions";
import { btn, btnPrimary, input } from "../ui";

export const STATUS: Record<OrderStatus, string> = {
  pending_payment: "Paiement en attente",
  confirmed: "À expédier",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  expired: "Expirée",
  refund_needed: "Remboursement à faire",
  refunded: "Remboursée",
};

export const REFUNDABLE: OrderStatus[] = ["confirmed", "shipped", "delivered", "refund_needed"];

export const dateFr = (value: Date | string) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });

export const dateTimeFr = (value: Date | string) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

/** Expédition : transporteur et numéro de suivi, puis « livrée ». */
export function ShipForms({ order }: { order: Order }) {
  if (order.status !== "confirmed" && order.status !== "shipped") return null;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <form action={shipOrder} className="flex flex-1 flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={order.id} />
        <select
          name="carrier"
          defaultValue={order.carrier ?? "colissimo"}
          aria-label="Transporteur"
          className={`${input} w-auto`}
        >
          {carrierIds.map((id) => (
            <option key={id} value={id}>
              {carriers[id].label}
            </option>
          ))}
        </select>
        <input
          name="tracking"
          defaultValue={order.tracking ?? ""}
          placeholder="Numéro de suivi (facultatif)"
          aria-label="Numéro de suivi"
          maxLength={40}
          className={`${input} min-w-48 flex-1`}
        />
        <button type="submit" className={order.status === "confirmed" ? btnPrimary : btn}>
          {order.status === "confirmed" ? "Marquer expédiée" : "Mettre à jour le suivi"}
        </button>
      </form>
      {order.status === "shipped" && (
        <form action={deliverOrder}>
          <input type="hidden" name="id" value={order.id} />
          <button type="submit" className={btnPrimary}>
            Marquer livrée
          </button>
        </form>
      )}
    </div>
  );
}

export function Refund({ order }: { order: Order }) {
  return (
    <details className="border-t border-border pt-4" open={order.status === "refund_needed"}>
      <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-muted hover:text-brown">
        Rembourser le client
      </summary>
      <form action={refundOrderAction} className="mt-3 flex flex-col gap-3 text-sm">
        <input type="hidden" name="id" value={order.id} />
        <label className="flex items-start gap-2">
          <input type="checkbox" name="confirm" value="yes" required className="mt-1" />
          <span>Rembourser {formatPrice(order.total)} au client via Stripe (irréversible)</span>
        </label>
        {order.status !== "refund_needed" && (
          <label className="flex items-start gap-2">
            <input type="checkbox" name="restock" value="yes" className="mt-1" />
            <span>Remettre les pièces en stock (retour reçu)</span>
          </label>
        )}
        <p className="text-xs text-muted">Un avoir est émis automatiquement si la commande avait une facture.</p>
        <div>
          <button type="submit" className={btn}>
            Confirmer le remboursement
          </button>
        </div>
      </form>
    </details>
  );
}
