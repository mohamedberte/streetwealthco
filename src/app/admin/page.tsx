import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { formatPrice, products } from "@/lib/products";
import { zones } from "@/lib/shipping";
import { isAdmin } from "@/server/admin-auth";
import { inventoryRows, listOrders, type OrderStatus } from "@/server/orders";
import { waitlistCounts } from "@/server/waitlist";
import {
  cancelOrderAction,
  deliverOrder,
  login,
  logout,
  shipOrder,
  updateStock,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATUS: Record<OrderStatus, string> = {
  pending_payment: "Paiement en attente",
  confirmed: "À expédier",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  expired: "Expirée",
  refund_needed: "Remboursement à faire",
};

const input = "border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-brown";
const btn =
  "border border-brown px-3 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-brown hover:text-white";

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;

  if (!(await isAdmin())) {
    const configured = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
    return (
      <PageShell>
        <h1 className="font-serif text-4xl">Administration</h1>
        {!configured ? (
          <p className="mt-6 text-sm text-brown-soft">
            Définissez ADMIN_PASSWORD et ADMIN_SESSION_SECRET dans les variables d&apos;environnement
            (voir SETUP.md).
          </p>
        ) : (
          <form action={login} className="mt-8 flex max-w-sm flex-col gap-4">
            <label className="text-[10px] uppercase tracking-[0.22em] text-muted" htmlFor="pw">
              Mot de passe
            </label>
            <input id="pw" name="password" type="password" required className={input} />
            {params.error && (
              <p role="alert" className="text-sm text-brown-soft">
                Mot de passe incorrect.
              </p>
            )}
            <button type="submit" className={btn}>
              Entrer
            </button>
          </form>
        )}
      </PageShell>
    );
  }

  const [orders, inventory, waiting] = await Promise.all([
    listOrders(60),
    inventoryRows(),
    waitlistCounts(),
  ]);
  const stockOf = (slug: string, size: string) =>
    inventory.find((row) => row.slug === slug && row.size === size);

  return (
    <PageShell wide>
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-4xl sm:text-5xl">Administration</h1>
        <form action={logout}>
          <button type="submit" className={btn}>
            Quitter
          </button>
        </form>
      </div>

      <h2 className="mt-12 text-[11px] uppercase tracking-[0.26em] text-gold">Commandes</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-brown-soft">Aucune commande pour l&apos;instant.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border border-border bg-white/60 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-medium">
                  {order.number}{" "}
                  <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-gold">
                    {STATUS[order.status]}
                  </span>
                </p>
                <p className="text-sm">
                  {formatPrice(order.total)} ·{" "}
                  {order.payment_status === "paid" ? "payé" : "non payé"}
                </p>
              </div>
              <p className="mt-2 text-sm text-brown-soft">
                {order.name} · {order.phone} · {order.email}
                <br />
                {order.address}, {order.postal_code} {order.city} ({zones[order.zone].label})
                {order.notes ? ` — ${order.notes}` : ""}
              </p>
              <p className="mt-2 text-sm">
                {order.items.map((i) => `${i.name} ${i.size} ×${i.quantity}`).join(" · ")}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {(order.status === "confirmed" || order.status === "shipped") && (
                  <form action={shipOrder} className="flex gap-2">
                    <input type="hidden" name="id" value={order.id} />
                    <input
                      name="tracking"
                      defaultValue={order.tracking ?? ""}
                      placeholder="Suivi (facultatif)"
                      className={input}
                    />
                    <button type="submit" className={btn}>
                      {order.status === "shipped" ? "Mettre à jour" : "Marquer expédiée"}
                    </button>
                  </form>
                )}
                {(order.status === "confirmed" || order.status === "shipped") && (
                  <form action={deliverOrder}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className={btn}>
                      Marquer livrée
                    </button>
                  </form>
                )}
                {["pending_payment", "confirmed", "shipped", "refund_needed"].includes(
                  order.status,
                ) && (
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className={btn}>
                      Annuler
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-16 text-[11px] uppercase tracking-[0.26em] text-gold">Stock</h2>
      <p className="mt-2 text-xs text-muted">
        Enregistrer un nouveau stock prévient automatiquement les personnes en liste d&apos;attente.
      </p>
      <div className="mt-4 space-y-6">
        {products.map((product) => (
          <div key={product.slug}>
            <p className="font-serif text-xl">{product.name}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {product.sizes.map((size) => {
                const row = stockOf(product.slug, size);
                const wait = waiting[`${product.slug}:${size}`] ?? 0;
                return (
                  <form
                    key={size}
                    action={updateStock}
                    className="flex items-center gap-2 border border-border bg-white/60 p-2"
                  >
                    <input type="hidden" name="slug" value={product.slug} />
                    <input type="hidden" name="size" value={size} />
                    <span className="w-12 text-xs uppercase tracking-[0.14em]">{size}</span>
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      defaultValue={row?.stock ?? 0}
                      className={`${input} w-20`}
                    />
                    <span className="text-[10px] text-muted">
                      rés. {row?.reserved ?? 0}
                      {wait > 0 ? ` · ${wait} en attente` : ""}
                    </span>
                    <button type="submit" className={btn}>
                      OK
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
