import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { zones } from "@/lib/shipping";
import { isAdmin } from "@/server/admin-auth";
import { listOrders, type Order, type OrderStatus } from "@/server/orders";
import { cancelOrderAction, deliverOrder, refundOrderAction, shipOrder } from "../actions";
import { AdminTitle, Banner } from "../AdminHeader";
import { btn, btnPrimary, card, input } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration — Commandes",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const STATUS: Record<OrderStatus, string> = {
  pending_payment: "Paiement en attente",
  confirmed: "À expédier",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  expired: "Expirée",
  refund_needed: "Remboursement à faire",
  refunded: "Remboursée",
};

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "Toutes" },
  { key: "confirmed", label: "À expédier" },
  { key: "refund_needed", label: "Remboursements" },
  { key: "shipped", label: "Expédiées" },
  { key: "delivered", label: "Livrées" },
  { key: "pending_payment", label: "En attente" },
  { key: "refunded", label: "Remboursées" },
];

const REFUNDABLE: OrderStatus[] = ["confirmed", "shipped", "delivered", "refund_needed"];
const URGENT: OrderStatus[] = ["confirmed", "refund_needed"];

const dateFr = (value: Date | string) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

function Refund({ order }: { order: Order }) {
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
        <div>
          <button type="submit" className={btn}>
            Confirmer le remboursement
          </button>
        </div>
      </form>
    </details>
  );
}

function OrderCard({ order }: { order: Order }) {
  const urgent = URGENT.includes(order.status);
  const canRefund = REFUNDABLE.includes(order.status) && Boolean(order.payment_ref);
  return (
    <li className={`p-5 sm:p-6 ${card} ${urgent ? "border-gold" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-serif text-xl">{order.number}</p>
        <p className="text-sm">
          <span className="font-medium">{formatPrice(order.total)}</span>
          <span className="text-muted"> · {dateFr(order.created_at)}</span>
        </p>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gold">{STATUS[order.status]}</p>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <p className="leading-relaxed text-brown-soft">
          <span className="text-brown">{order.name}</span>
          <br />
          {order.email}
          <br />
          {order.phone}
        </p>
        <p className="leading-relaxed text-brown-soft">
          {order.address}
          <br />
          {order.postal_code} {order.city} · {zones[order.zone].label}
          {order.notes && (
            <>
              <br />
              <span className="text-muted">« {order.notes} »</span>
            </>
          )}
        </p>
      </div>

      <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
        {order.items.map((item) => (
          <li key={`${item.slug}-${item.size}`} className="flex justify-between gap-4">
            <span>
              {item.name} · {item.size} × {item.quantity}
            </span>
            <span className="text-brown-soft">{formatPrice(item.unit_price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      {(order.status === "confirmed" || order.status === "shipped") && (
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <form action={shipOrder} className="flex flex-1 flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={order.id} />
            <input
              name="tracking"
              defaultValue={order.tracking ?? ""}
              placeholder="Numéro de suivi (facultatif)"
              aria-label="Numéro de suivi"
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
      )}

      {order.status === "pending_payment" && (
        <form action={cancelOrderAction} className="mt-5 border-t border-border pt-4">
          <input type="hidden" name="id" value={order.id} />
          <button type="submit" className={btn}>
            Annuler la commande
          </button>
        </form>
      )}

      {canRefund && (
        <div className="mt-5">
          <Refund order={order} />
        </div>
      )}
      {order.status === "refunded" && order.refunded_at && (
        <p className="mt-4 text-xs text-muted">Remboursée le {dateFr(order.refunded_at)}.</p>
      )}
    </li>
  );
}

export default async function OrdersAdminPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect("/admin");
  const params = await searchParams;
  const statusParam = one(params.statut) ?? "";
  const status = FILTERS.some((f) => f.key === statusParam) && statusParam ? (statusParam as OrderStatus) : undefined;
  const orders = await listOrders(60, status);

  return (
    <>
      <AdminTitle title="Commandes" />
      <Banner notice={one(params.notice)} error={one(params.error)} field={one(params.field)} />

      <ul className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (f.key || undefined) === status;
          return (
            <li key={f.key || "all"}>
              <Link
                href={f.key ? `/admin/commandes?statut=${f.key}` : "/admin/commandes"}
                className={`block border px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors ${
                  active ? "border-brown bg-brown text-white" : "border-border hover:border-brown"
                }`}
              >
                {f.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {orders.length === 0 ? (
        <p className={`mt-6 p-5 text-sm text-brown-soft ${card}`}>Aucune commande dans cette vue.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      )}
    </>
  );
}
