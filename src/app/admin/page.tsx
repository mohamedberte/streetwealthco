import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { isAdmin } from "@/server/admin-auth";
import { getAllProducts } from "@/server/catalog";
import { supabaseConfigured } from "@/server/db";
import { dashboardStats, inventoryRows } from "@/server/orders";
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

  const [stats, inventory, waiting, products] = await Promise.all([
    dashboardStats(),
    inventoryRows(),
    waitlistEntries(),
    getAllProducts(),
  ]);

  const lowStock = products
    .filter((product) => product.active)
    .flatMap((product) =>
      product.sizes.filter((size) => {
        const row = inventory.find((r) => r.slug === product.slug && r.size === size);
        return (row ? Math.max(row.stock - row.reserved, 0) : 0) <= LOW_STOCK;
      }),
    ).length;
  const pendingWaiting = waiting.filter((entry) => !entry.notified_at).length;
  const nothing = stats.toShip + stats.refundNeeded + lowStock + pendingWaiting === 0;

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
