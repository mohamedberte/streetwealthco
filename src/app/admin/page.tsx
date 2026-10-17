import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { formatPrice } from "@/lib/products";
import { zones } from "@/lib/shipping";
import { isAdmin } from "@/server/admin-auth";
import { getAllProducts } from "@/server/catalog";
import {
  dashboardStats,
  inventoryRows,
  listOrders,
  type OrderStatus,
} from "@/server/orders";
import { waitlistEntries } from "@/server/waitlist";
import {
  cancelOrderAction,
  deliverOrder,
  login,
  logout,
  notifyWaitlistAction,
  refundOrderAction,
  removeWaitlistAction,
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
  refunded: "Remboursée",
};

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "Toutes" },
  { key: "confirmed", label: "À expédier" },
  { key: "refund_needed", label: "Remboursement à faire" },
  { key: "pending_payment", label: "Paiement en attente" },
  { key: "shipped", label: "Expédiées" },
  { key: "delivered", label: "Livrées" },
  { key: "refunded", label: "Remboursées" },
];

const REFUNDABLE: OrderStatus[] = ["confirmed", "shipped", "delivered", "refund_needed"];
const LOW_STOCK = 3;

const input = "border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-brown";
const btn =
  "border border-brown px-3 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-brown hover:text-white";
const sectionTitle = "text-[11px] uppercase tracking-[0.26em] text-gold";

const dateFr = (value: Date | string) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

function Stat({ label, value, hint, alert }: { label: string; value: string; hint?: string; alert?: boolean }) {
  return (
    <div className={`border bg-white/60 p-4 ${alert ? "border-gold" : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl leading-none">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

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
                {params.error === "locked"
                  ? "Trop de tentatives. Réessayez dans 15 minutes."
                  : "Mot de passe incorrect."}
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

  const filterParam = typeof params.statut === "string" ? params.statut : "";
  const filter = FILTERS.some((f) => f.key === filterParam) && filterParam ? (filterParam as OrderStatus) : undefined;

  const [stats, orders, inventory, waiting, products] = await Promise.all([
    dashboardStats(),
    listOrders(60, filter),
    inventoryRows(),
    waitlistEntries(),
    getAllProducts(),
  ]);
  const stockOf = (slug: string, size: string) =>
    inventory.find((row) => row.slug === slug && row.size === size);
  const available = (slug: string, size: string) => {
    const row = stockOf(slug, size);
    return row ? Math.max(row.stock - row.reserved, 0) : 0;
  };

  const lowStock = products
    .filter((product) => product.active)
    .flatMap((product) =>
    product.sizes
      .map((size) => ({ product, size, left: available(product.slug, size) }))
      .filter((entry) => entry.left <= LOW_STOCK),
  );

  const waitingGroups = new Map<string, typeof waiting>();
  for (const entry of waiting) {
    const key = `${entry.slug}:${entry.size}`;
    waitingGroups.set(key, [...(waitingGroups.get(key) ?? []), entry]);
  }
  const pendingWaiting = waiting.filter((entry) => !entry.notified_at).length;

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

      {params.notice === "refund_failed" && (
        <p role="alert" className="mt-6 border border-gold bg-white/60 p-4 text-sm">
          Le remboursement a échoué chez Stripe. Rien n&apos;a été modifié : vérifiez le paiement
          dans le tableau de bord Stripe puis réessayez.
        </p>
      )}

      <nav aria-label="Sections" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.22em]">
        <a href="#indicateurs" className="hover:text-gold">Indicateurs</a>
        <a href="#commandes" className="hover:text-gold">Commandes</a>
        <a href="#stock" className="hover:text-gold">Stock</a>
        <a href="#attente" className="hover:text-gold">Liste d&apos;attente ({pendingWaiting})</a>
        <Link href="/admin/produits" className="hover:text-gold">Pièces →</Link>
        <Link href="/admin/contenu" className="hover:text-gold">Contenu du site →</Link>
      </nav>

      <h2 id="indicateurs" className={`mt-12 ${sectionTitle}`}>Indicateurs</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="CA 30 jours" value={formatPrice(stats.revenue30d)} hint={`7 jours : ${formatPrice(stats.revenue7d)}`} />
        <Stat label="CA total" value={formatPrice(stats.revenue)} hint="TTC, livraison comprise" />
        <Stat label="Commandes payées" value={String(stats.paidOrders)} />
        <Stat
          label="Panier moyen"
          value={stats.paidOrders ? formatPrice(Math.round(stats.revenue / stats.paidOrders)) : "—"}
        />
        <Stat label="À expédier" value={String(stats.toShip)} alert={stats.toShip > 0} />
        <Stat label="Remboursements à faire" value={String(stats.refundNeeded)} alert={stats.refundNeeded > 0} />
        <Stat label="Paiements en attente" value={String(stats.pending)} hint="Stock réservé 30 min" />
        <Stat
          label="Remboursées"
          value={String(stats.refundedCount)}
          hint={stats.refundedCount ? formatPrice(stats.refundedTotal) : undefined}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        Taux de conversion et visites : non mesurés ici (voir SETUP.md, mesure d&apos;audience).
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.22em] text-muted">Ventes par pièce</h3>
          {stats.byProduct.length === 0 ? (
            <p className="mt-3 text-sm text-brown-soft">Aucune vente pour l&apos;instant.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border border border-border bg-white/60 text-sm">
              {stats.byProduct.map((row) => (
                <li key={row.slug} className="flex justify-between gap-4 px-4 py-2.5">
                  <span>{row.name}</span>
                  <span className="text-brown-soft">
                    {row.qty} vendue{row.qty > 1 ? "s" : ""} · {formatPrice(row.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.22em] text-muted">
            Stock bas (≤ {LOW_STOCK})
          </h3>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-brown-soft">Aucune alerte.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border border border-border bg-white/60 text-sm">
              {lowStock.map(({ product, size, left }) => (
                <li key={`${product.slug}:${size}`} className="flex justify-between gap-4 px-4 py-2.5">
                  <span>
                    {product.name} · {size}
                  </span>
                  <span className={left === 0 ? "text-gold" : "text-brown-soft"}>
                    {left === 0 ? "Épuisé" : `${left} restant${left > 1 ? "s" : ""}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 id="commandes" className={`mt-16 ${sectionTitle}`}>Commandes</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (f.key || undefined) === filter;
          return (
            <li key={f.key || "all"}>
              <Link
                href={f.key ? `/admin?statut=${f.key}#commandes` : "/admin#commandes"}
                className={`block border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${
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
        <p className="mt-4 text-sm text-brown-soft">Aucune commande.</p>
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
                  {formatPrice(order.total)} · {dateFr(order.created_at)} ·{" "}
                  {order.status === "refunded"
                    ? "remboursé"
                    : order.payment_status === "paid"
                      ? "payé"
                      : "non payé"}
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
                {order.status === "pending_payment" && (
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className={btn}>
                      Annuler
                    </button>
                  </form>
                )}
              </div>

              {REFUNDABLE.includes(order.status) && order.payment_ref && (
                <details className="mt-4 border-t border-border pt-3">
                  <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-muted hover:text-brown">
                    Rembourser
                  </summary>
                  <form action={refundOrderAction} className="mt-3 flex flex-col gap-2 text-sm">
                    <input type="hidden" name="id" value={order.id} />
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="confirm" value="yes" required />
                      Rembourser {formatPrice(order.total)} au client via Stripe (irréversible)
                    </label>
                    {order.status !== "refund_needed" && (
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="restock" value="yes" />
                        Remettre les pièces en stock (retour reçu)
                      </label>
                    )}
                    <div>
                      <button type="submit" className={btn}>
                        Confirmer le remboursement
                      </button>
                    </div>
                  </form>
                </details>
              )}
              {order.status === "refunded" && order.refunded_at && (
                <p className="mt-3 text-xs text-muted">Remboursée le {dateFr(order.refunded_at)}.</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 id="stock" className={`mt-16 ${sectionTitle}`}>Stock</h2>
      <p className="mt-2 text-xs text-muted">
        Enregistrer un nouveau stock prévient automatiquement les personnes en liste d&apos;attente.
      </p>
      <div className="mt-4 space-y-6">
        {products.map((product) => (
          <div key={product.slug}>
            <p className="font-serif text-xl">
              {product.name}
              {!product.active && <span className="text-sm text-muted"> (archivée)</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {product.sizes.map((size) => {
                const row = stockOf(product.slug, size);
                const wait = (waitingGroups.get(`${product.slug}:${size}`) ?? []).filter(
                  (entry) => !entry.notified_at,
                ).length;
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

      <h2 id="attente" className={`mt-16 ${sectionTitle}`}>Liste d&apos;attente</h2>
      <p className="mt-2 text-xs text-muted">
        Les inscrits sont prévenus par e-mail, dans l&apos;ordre d&apos;inscription, quand du stock
        est disponible. Chaque e-mail contient un lien de désinscription.
      </p>
      {waitingGroups.size === 0 ? (
        <p className="mt-4 text-sm text-brown-soft">Personne en attente.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {[...waitingGroups.entries()].map(([key, entries]) => {
            const [slug, size] = key.split(":");
            const product = products.find((p) => p.slug === slug);
            const open = entries.filter((entry) => !entry.notified_at);
            return (
              <details key={key} className="border border-border bg-white/60 p-4" open={open.length > 0}>
                <summary className="cursor-pointer text-sm">
                  {product?.name ?? slug} · {size} — {open.length} en attente
                  {entries.length > open.length ? `, ${entries.length - open.length} prévenu(s)` : ""}
                  {` · ${available(slug, size)} dispo`}
                </summary>
                <ul className="mt-3 divide-y divide-border text-sm">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                      <span>
                        {entry.email}{" "}
                        <span className="text-xs text-muted">
                          · inscrit le {dateFr(entry.created_at)}
                          {entry.notified_at ? ` · prévenu le ${dateFr(entry.notified_at)}` : ""}
                        </span>
                      </span>
                      <form action={removeWaitlistAction}>
                        <input type="hidden" name="id" value={entry.id} />
                        <button type="submit" className={btn}>
                          Retirer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
                {open.length > 0 && available(slug, size) > 0 && (
                  <form action={notifyWaitlistAction} className="mt-3">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="size" value={size} />
                    <button type="submit" className={btn}>
                      Prévenir maintenant
                    </button>
                  </form>
                )}
              </details>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
