import type { Metadata } from "next";
import Link from "next/link";
import { formatOpening } from "@/lib/paris";
import { DROP_SIZE, formatPrice, isUpcoming } from "@/lib/products";
import { isAdmin } from "@/server/admin-auth";
import { getAllProducts } from "@/server/catalog";
import { supabaseConfigured } from "@/server/db";
import { dailySales, dashboardStats, inventoryRows } from "@/server/orders";
import { waitlistEntries } from "@/server/waitlist";
import { login } from "./actions";
import { AdminTitle } from "./AdminHeader";
import { btnPrimary, card, input, label, sectionTitle } from "./ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const LOW_STOCK = 3;

function Task({
  href,
  count,
  singular,
  plural,
  alert,
}: {
  href: string;
  count: number;
  singular: string;
  plural: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-4 p-5 transition-colors hover:border-brown ${card} ${
        alert ? "border-gold" : ""
      }`}
    >
      <span className="flex items-baseline gap-3">
        <span className="font-serif text-4xl leading-none">{count}</span>
        <span className="text-sm text-brown-soft">{count > 1 ? plural : singular}</span>
      </span>
      <span aria-hidden className="text-muted transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

function Figure({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className={`p-5 ${card}`}>
      <p className={label}>{title}</p>
      <p className="mt-3 font-serif text-3xl leading-none">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminHome({ searchParams }: Props) {
  if (!(await isAdmin())) {
    const params = await searchParams;
    return (
      <>
        <AdminTitle title="Administration" />
        {!supabaseConfigured() ? (
          <p className="mt-6 text-sm text-brown-soft">
            Définissez les variables Supabase (NEXT_PUBLIC_SUPABASE_URL, clé publique et
            SUPABASE_SERVICE_ROLE_KEY) dans l&apos;environnement (voir SETUP.md).
          </p>
        ) : (
          <form action={login} className="mt-8 flex w-full max-w-sm flex-col gap-3">
            <label className={label} htmlFor="email">
              E-mail
            </label>
            <input id="email" name="email" type="email" autoComplete="username" required className={input} />
            <label className={`${label} mt-2`} htmlFor="pw">
              Mot de passe
            </label>
            <input
              id="pw"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={input}
            />
            {params.error && (
              <p role="alert" className="text-sm text-brown-soft">
                {params.error === "locked"
                  ? "Trop de tentatives. Réessayez dans 15 minutes."
                  : "Identifiants incorrects ou accès non autorisé."}
              </p>
            )}
            <button type="submit" className={`${btnPrimary} mt-3`}>
              Entrer
            </button>
          </form>
        )}
      </>
    );
  }

  const [stats, inventory, waiting, products, daily] = await Promise.all([
    dashboardStats(),
    inventoryRows(),
    waitlistEntries(),
    getAllProducts(),
    dailySales(14),
  ]);

  const availableOf = (slug: string, size: string) => {
    const row = inventory.find((r) => r.slug === slug && r.size === size);
    return row ? Math.max(row.stock - row.reserved, 0) : 0;
  };

  // Pièces en vente dont une taille est presque épuisée.
  const lowStockList = products
    .filter((product) => product.active && !isUpcoming(product))
    .map((product) => ({
      product,
      sizes: product.sizes
        .map((size) => ({ size, left: availableOf(product.slug, size) }))
        .filter((entry) => entry.left <= LOW_STOCK),
    }))
    .filter((entry) => entry.sizes.length > 0);
  const lowStock = lowStockList.reduce((sum, entry) => sum + entry.sizes.length, 0);

  const pending = waiting.filter((entry) => !entry.notified_at);
  const pendingWaiting = pending.filter((entry) => entry.size !== DROP_SIZE).length;

  // Alertes d'ouverture à envoyer : la vente est ouverte et des inscrits attendent.
  const dropsToNotify = pending.filter((entry) => {
    if (entry.size !== DROP_SIZE) return false;
    const product = products.find((p) => p.slug === entry.slug);
    return product !== undefined && !isUpcoming(product);
  }).length;

  const upcoming = products
    .filter((product) => product.active && isUpcoming(product))
    .sort((a, b) => Date.parse(a.opensAt!) - Date.parse(b.opensAt!));

  // Tailles les plus demandées : inscrits en attente, par pièce et taille.
  const demand = new Map<string, number>();
  for (const entry of pending) {
    if (entry.size === DROP_SIZE) continue;
    const key = `${entry.slug}:${entry.size}`;
    demand.set(key, (demand.get(key) ?? 0) + 1);
  }
  const topDemand = [...demand.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [slug, size] = key.split(":");
      return { slug, size, count, name: products.find((p) => p.slug === slug)?.name ?? slug };
    });

  const today = daily[daily.length - 1];
  const maxRevenue = Math.max(...daily.map((entry) => entry.revenue), 0);
  const nothing = stats.toShip + stats.refundNeeded + lowStock + pendingWaiting + dropsToNotify === 0;

  return (
    <>
      <AdminTitle title="Accueil" />

      <h2 className={`mt-10 ${sectionTitle}`}>À traiter</h2>
      {nothing ? (
        <p className={`mt-4 p-5 text-sm text-brown-soft ${card}`}>Rien à traiter pour le moment.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {stats.refundNeeded > 0 && (
            <Task
              href="/admin/commandes?statut=refund_needed"
              count={stats.refundNeeded}
              singular="remboursement à faire"
              plural="remboursements à faire"
              alert
            />
          )}
          {stats.toShip > 0 && (
            <Task
              href="/admin/commandes?statut=confirmed"
              count={stats.toShip}
              singular="commande à expédier"
              plural="commandes à expédier"
            />
          )}
          {lowStock > 0 && (
            <Task
              href="/admin/produits"
              count={lowStock}
              singular="taille en stock bas"
              plural="tailles en stock bas"
            />
          )}
          {dropsToNotify > 0 && (
            <Task
              href="/admin/produits#attente"
              count={dropsToNotify}
              singular="alerte d'ouverture à envoyer"
              plural="alertes d'ouverture à envoyer"
              alert
            />
          )}
          {pendingWaiting > 0 && (
            <Task
              href="/admin/produits#attente"
              count={pendingWaiting}
              singular="personne en liste d'attente"
              plural="personnes en liste d'attente"
            />
          )}
        </div>
      )}

      <h2 className={`mt-14 ${sectionTitle}`}>Chiffres clés</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure title="CA 30 jours" value={formatPrice(stats.revenue30d)} hint={`7 jours : ${formatPrice(stats.revenue7d)}`} />
        <Figure title="CA total TTC" value={formatPrice(stats.revenue)} hint="Livraison comprise" />
        <Figure title="Commandes payées" value={String(stats.paidOrders)} />
        <Figure
          title="Panier moyen"
          value={stats.paidOrders ? formatPrice(Math.round(stats.revenue / stats.paidOrders)) : "—"}
        />
      </div>

      <h2 className={`mt-14 ${sectionTitle}`}>Activité — 14 jours</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Figure
          title="Ventes du jour"
          value={formatPrice(today?.revenue ?? 0)}
          hint={`${today?.orders ?? 0} commande${(today?.orders ?? 0) > 1 ? "s" : ""} payée${(today?.orders ?? 0) > 1 ? "s" : ""}`}
        />
        <Figure
          title="14 derniers jours"
          value={formatPrice(daily.reduce((sum, entry) => sum + entry.revenue, 0))}
          hint={`${daily.reduce((sum, entry) => sum + entry.orders, 0)} commande(s)`}
        />
      </div>
      <div className={`mt-3 p-5 ${card}`}>
        <ol className="flex h-32 items-end gap-1.5" aria-label="Chiffre d'affaires par jour">
          {daily.map((entry) => (
            <li
              key={entry.day}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${entry.day} : ${formatPrice(entry.revenue)} · ${entry.orders} commande(s)`}
            >
              <span
                className={`w-full ${entry.revenue > 0 ? "bg-gold" : "bg-border"}`}
                style={{ height: `${maxRevenue > 0 ? Math.max((entry.revenue / maxRevenue) * 100, 3) : 3}%` }}
              />
            </li>
          ))}
        </ol>
        <ol className="mt-2 flex gap-1.5" aria-hidden>
          {daily.map((entry) => (
            <li key={entry.day} className="flex-1 text-center text-[10px] text-muted">
              {entry.day.slice(8)}
            </li>
          ))}
        </ol>
      </div>

      {upcoming.length > 0 && (
        <>
          <h2 className={`mt-14 ${sectionTitle}`}>Prochaines ouvertures</h2>
          <ul className={`mt-4 divide-y divide-border text-sm ${card}`}>
            {upcoming.map((product) => (
              <li key={product.slug} className="flex justify-between gap-4 px-5 py-3">
                <span>{product.name}</span>
                <span className="text-brown-soft">
                  {formatOpening(product.opensAt!)} ·{" "}
                  {pending.filter((e) => e.slug === product.slug && e.size === DROP_SIZE).length} alerte(s)
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className={`mt-14 ${sectionTitle}`}>Stock à surveiller</h2>
      {lowStockList.length === 0 ? (
        <p className={`mt-4 p-5 text-sm text-brown-soft ${card}`}>Aucune taille en stock bas.</p>
      ) : (
        <ul className={`mt-4 divide-y divide-border text-sm ${card}`}>
          {lowStockList.map(({ product, sizes }) => (
            <li key={product.slug} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-5 py-3">
              <Link href={`/admin/produits#p-${product.slug}`} className="underline-offset-4 hover:underline">
                {product.name}
              </Link>
              <span className="text-brown-soft">
                {sizes.map(({ size, left }) => `${size} : ${left === 0 ? "épuisé" : left}`).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className={`mt-14 ${sectionTitle}`}>Tailles les plus demandées</h2>
      {topDemand.length === 0 ? (
        <p className={`mt-4 p-5 text-sm text-brown-soft ${card}`}>Aucune demande en liste d&apos;attente.</p>
      ) : (
        <ul className={`mt-4 divide-y divide-border text-sm ${card}`}>
          {topDemand.map((row) => (
            <li key={`${row.slug}:${row.size}`} className="flex justify-between gap-4 px-5 py-3">
              <span>
                {row.name} · {row.size}
              </span>
              <span className="text-brown-soft">
                {row.count} en attente · {availableOf(row.slug, row.size)} dispo
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className={`mt-14 ${sectionTitle}`}>Ventes par pièce</h2>
      {stats.byProduct.length === 0 ? (
        <p className={`mt-4 p-5 text-sm text-brown-soft ${card}`}>Aucune vente pour l&apos;instant.</p>
      ) : (
        <ul className={`mt-4 divide-y divide-border text-sm ${card}`}>
          {stats.byProduct.map((row) => (
            <li key={row.slug} className="flex justify-between gap-4 px-5 py-3">
              <span>{row.name}</span>
              <span className="text-brown-soft">
                {row.qty} vendue{row.qty > 1 ? "s" : ""} · {formatPrice(row.revenue)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
