import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { formatPrice } from "@/lib/products";
import { currentUser, isAdminUser } from "@/server/auth";
import { supabaseConfigured } from "@/server/db";
import { listOrdersForUser, type OrderStatus } from "@/server/orders";
import { deleteAccount, forgotPassword, signIn, signOut, signUp } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compte", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const MESSAGES: Record<string, string> = {
  inscrit: "Si cette adresse peut être utilisée, un e-mail de confirmation vient de lui être envoyé.",
  reinit: "Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d'être envoyé.",
  echec: "Identifiants incorrects, ou adresse e-mail non confirmée.",
  invalide: "Informations invalides (mot de passe : 10 caractères minimum).",
  consent: "Veuillez accepter la politique de confidentialité.",
  limite: "Trop de tentatives. Réessayez dans 15 minutes.",
  lien: "Ce lien n'est plus valide. Demandez-en un nouveau.",
  mdp: "Votre mot de passe a été mis à jour.",
  supprime: "Votre compte a été supprimé.",
  "suppression-echec": "Suppression impossible : mot de passe incorrect ou erreur technique.",
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

const input = "border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-brown";
const label = "text-[10px] uppercase tracking-[0.22em] text-muted";
const btn =
  "border border-brown px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-brown hover:text-white";
const title = "text-[11px] uppercase tracking-[0.26em] text-gold";

export default async function AccountPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = typeof params.m === "string" ? params.m : "";
  const message = MESSAGES[code];
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
        <p className="mt-4 text-sm text-brown-soft">
          Un compte est facultatif : vous pouvez toujours commander sans. Il permet de retrouver vos
          commandes.
        </p>
        {notice}

        <section className="mt-10">
          <h2 className={title}>Se connecter</h2>
          <form action={signIn} className="mt-4 flex max-w-sm flex-col gap-3">
            <label className={label} htmlFor="login-email">E-mail</label>
            <input id="login-email" name="email" type="email" autoComplete="username" required className={input} />
            <label className={label} htmlFor="login-pw">Mot de passe</label>
            <input
              id="login-pw"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={input}
            />
            <button type="submit" className={btn}>Connexion</button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className={title}>Mot de passe oublié</h2>
          <form action={forgotPassword} className="mt-4 flex max-w-sm flex-col gap-3">
            <label className={label} htmlFor="forgot-email">E-mail</label>
            <input id="forgot-email" name="email" type="email" autoComplete="email" required className={input} />
            <button type="submit" className={btn}>Recevoir un lien</button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className={title}>Créer un compte</h2>
          <form action={signUp} className="mt-4 flex max-w-sm flex-col gap-3">
            <label className={label} htmlFor="signup-email">E-mail</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" required className={input} />
            <label className={label} htmlFor="signup-pw">Mot de passe (10 caractères minimum)</label>
            <input
              id="signup-pw"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={72}
              required
              className={input}
            />
            <label className="flex items-start gap-2 text-xs text-brown-soft">
              <input type="checkbox" name="consent" required className="mt-0.5" />
              <span>
                J&apos;ai lu la{" "}
                <Link href="/infos/confidentialite" className="underline">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>
            <button type="submit" className={btn}>Créer mon compte</button>
          </form>
        </section>
      </PageShell>
    );
  }

  const admin = isAdminUser(user);
  const orders = await listOrdersForUser(user.id, user.email_confirmed_at ? (user.email ?? null) : null);

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
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <Link href={`/commande/${order.token}`} className="underline">
                    {order.number}
                  </Link>
                  <p className="text-xs text-muted">
                    {order.created_at.toLocaleDateString("fr-FR")} · {STATUS[order.status]}
                  </p>
                </div>
                <span>{formatPrice(order.total)}</span>
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
        <Link href="/compte/mot-de-passe" className={btn}>
          Changer de mot de passe
        </Link>
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
            <label className={label} htmlFor="delete-pw">Mot de passe</label>
            <input
              id="delete-pw"
              name="password"
              type="password"
              autoComplete="current-password"
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
