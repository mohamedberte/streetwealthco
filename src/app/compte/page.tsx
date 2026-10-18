import type { Metadata } from "next";
import Link from "next/link";
import { CodeLogin } from "@/components/CodeLogin";
import { PageShell } from "@/components/PageShell";
import { formatPrice } from "@/lib/products";
import { currentUser, isAdminUser } from "@/server/auth";
import { supabaseConfigured } from "@/server/db";
import { invoiceNumbersByOrder } from "@/server/invoices";
import { listOrdersForUser, type OrderStatus } from "@/server/orders";
import { deleteAccount, signOut } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compte", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const MESSAGES: Record<string, string> = {
  limite: "Trop de tentatives. Réessayez dans 15 minutes.",
  lien: "Ce lien n'est plus valide. Demandez un nouveau code.",
  supprime: "Votre compte a été supprimé.",
  "suppression-echec": "Suppression impossible : saisissez SUPPRIMER pour confirmer, ou réessayez plus tard.",
  admin: "Un compte administrateur ne peut pas être supprimé depuis cette page.",
};

const STATUS: Record<OrderStatus, string> = {
  pending_payment: "Paiement en attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  expired: "Expirée",
  refund_needed: "Remboursement en cours",
  refunded: "Remboursée",
};

const input = "block w-full border border-border bg-white px-3 py-3 text-base outline-none focus:border-brown";
const label = "text-[10px] uppercase tracking-[0.22em] text-muted";
const btn =
  "border border-brown px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-brown hover:text-white";
const title = "text-[11px] uppercase tracking-[0.26em] text-gold";

export default async function AccountPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = typeof params.m === "string" ? params.m : "";
  const message = MESSAGES[code];
  // Retour après connexion : chemin interne uniquement.
  const next =
    typeof params.next === "string" && /^\/(?!\/)[\w\-./]*$/.test(params.next) ? params.next : "/compte";
  const notice = message && (
    <p role="status" className="mt-6 border border-border bg-white/60 px-4 py-3 text-sm text-brown-soft">
      {message}
    </p>
  );

  if (!supabaseConfigured()) {
    return (
      <PageShell>
        <h1 className="font-serif text-4xl">Compte</h1>
        <p className="mt-6 text-sm text-brown-soft">Les comptes clients ne sont pas encore activés.</p>
      </PageShell>
    );
  }

  const user = await currentUser();

  if (!user) {
    return (
      <PageShell>
        <h1 className="font-serif text-4xl">Compte</h1>
        <p className="mt-4 text-sm leading-relaxed text-brown-soft">
          Renseignez votre adresse e-mail : nous vous envoyons un code de connexion pour retrouver
          vos commandes.
        </p>
        {notice}

        <div className="mt-8 max-w-md">
          <CodeLogin next={next} />
          <p className="mt-6 text-xs text-muted">
            <Link href="/infos/confidentialite" className="underline hover:text-brown">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </PageShell>
    );
  }

  const admin = isAdminUser(user);
  const orders = await listOrdersForUser(user.id, user.email_confirmed_at ? (user.email ?? null) : null);
  const invoices = await invoiceNumbersByOrder(orders.map((order) => order.id));

  return (
    <PageShell>
      <p className={title}>Compte</p>
      <h1 className="mt-3 font-serif text-4xl">{user.email}</h1>
      {notice}

      <section className="mt-10">
        <h2 className={title}>Mes commandes</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-brown-soft">Aucune commande pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/commande/${order.token}`}
                  className="flex flex-wrap items-center justify-between gap-3 border border-border bg-ivory px-4 py-4 text-sm transition-colors hover:border-brown"
                >
                  <span>
                    <span className="block font-serif text-lg">{order.number}</span>
                    <span className="block text-xs text-muted">
                      {order.created_at.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} · {STATUS[order.status]}
                    </span>
                  </span>
                  <span>{formatPrice(order.total)}</span>
                </Link>
                {(invoices.get(order.id)?.invoice || invoices.get(order.id)?.creditNote) && (
                  <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 px-1 text-xs text-muted">
                    {invoices.get(order.id)?.invoice && (
                      <a href={`/commande/${order.token}/facture`} className="underline hover:text-brown">
                        Facture {invoices.get(order.id)?.invoice} (PDF)
                      </a>
                    )}
                    {invoices.get(order.id)?.creditNote && (
                      <a href={`/commande/${order.token}/facture?type=avoir`} className="underline hover:text-brown">
                        Avoir {invoices.get(order.id)?.creditNote} (PDF)
                      </a>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        {admin && (
          <Link href="/admin" className={btn}>
            Administration
          </Link>
        )}
        <form action={signOut}>
          <button type="submit" className={btn}>Déconnexion</button>
        </form>
      </section>

      {!admin && (
        <section className="mt-14 border-t border-border pt-8">
          <h2 className={title}>Supprimer mon compte</h2>
          <p className="mt-3 text-sm text-brown-soft">
            Action définitive. Vos commandes restent conservées pour nos obligations comptables, sans
            lien avec votre compte.
          </p>
          <form action={deleteAccount} className="mt-4 flex max-w-sm flex-col gap-3">
            <label className={label} htmlFor="delete-confirm">Saisissez SUPPRIMER pour confirmer</label>
            <input
              id="delete-confirm"
              name="confirm"
              autoComplete="off"
              required
              className={input}
            />
            <button type="submit" className={btn}>Supprimer définitivement</button>
          </form>
        </section>
      )}
    </PageShell>
  );
}
