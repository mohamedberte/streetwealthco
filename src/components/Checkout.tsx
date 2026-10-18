"use client";

import { useEffect, useRef, useState } from "react";
import { placeOrder } from "@/app/actions";
import { checkoutProfile } from "@/app/compte/actions";
import { AddressInput } from "@/components/AddressInput";
import { useCart } from "@/components/CartProvider";
import { ACCOUNT_OFFER_KEY } from "@/lib/account-offer";
import { formatPrice } from "@/lib/products";
import { zoneIds, zones, euCountries, type ZoneId } from "@/lib/shipping";

const field =
  "mt-2 w-full border border-ivory/25 bg-transparent px-3 py-2.5 text-sm text-ivory outline-none placeholder:text-ivory/35 focus:border-ivory";
const label = "block text-[10px] uppercase tracking-[0.22em] text-ivory/60";

export function Checkout({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const { items, total } = useCart();
  const [zone, setZone] = useState<ZoneId>("france");
  const [country, setCountry] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [account, setAccount] = useState(false);
  const [createAccount, setCreateAccount] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Client connecté : coordonnées de sa dernière commande (sans écraser ce qui est déjà saisi).
  useEffect(() => {
    let alive = true;
    checkoutProfile()
      .then((profile) => {
        const form = formRef.current;
        if (!alive || !profile || !form) return;
        setAccount(true);
        if (profile.address) {
          setZone(profile.zone);
          if (profile.zone === "europe") setCountry(profile.country);
        }
        const fill = (name: string, value: string) => {
          const element = form.elements.namedItem(name);
          if (element instanceof HTMLInputElement && !element.value) element.value = value;
        };
        fill("email", profile.email);
        fill("name", profile.name);
        fill("phone", profile.phone);
        fill("address", profile.address);
        fill("postalCode", profile.postalCode);
        fill("city", profile.city);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const shipping = zones[zone].fee;

  function fillAddress(suggestion: { address: string; postalCode: string; city: string }) {
    const form = formRef.current;
    if (!form) return;
    const set = (name: string, value: string) => {
      const element = form.elements.namedItem(name);
      if (element instanceof HTMLInputElement) element.value = value;
    };
    set("address", suggestion.address);
    set("postalCode", suggestion.postalCode);
    set("city", suggestion.city);
  }
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");

    const result = await placeOrder({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      zone,
      country: zone === "france" ? "FR" : country,
      address: form.get("address"),
      postalCode: form.get("postalCode"),
      city: form.get("city"),
      notes: form.get("notes") || undefined,
      consent,
      items: items.map((item) => ({
        slug: item.slug,
        size: item.size,
        quantity: item.quantity,
      })),
    });

    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }

    // Redirection vers la page de paiement sécurisée Stripe.
    // Le code de connexion sera envoyé au retour, une fois le paiement confirmé.
    try {
      if (!account && createAccount) {
        sessionStorage.setItem(ACCOUNT_OFFER_KEY, String(form.get("email") ?? "").trim().toLowerCase());
      } else {
        sessionStorage.removeItem(ACCOUNT_OFFER_KEY);
      }
    } catch {}
    window.location.assign(result.redirect);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <button
          type="button"
          onClick={onBack}
          className="text-[10px] uppercase tracking-[0.2em] text-ivory/60 hover:text-ivory"
        >
          ← Retour à la sélection
        </button>

        <p className="text-[11px] leading-relaxed text-ivory/60">
          {account ? (
            "Connecté : vos coordonnées sont pré-remplies."
          ) : (
            <>
              Déjà client ?{" "}
              <button type="button" onClick={onLogin} className="underline hover:text-ivory">
                Se connecter
              </button>
            </>
          )}
        </p>
        <div>
          <label htmlFor="co-name" className={label}>
            Nom complet
          </label>
          <input id="co-name" name="name" required autoComplete="name" className={field} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="co-email" className={label}>
              E-mail
            </label>
            <input
              id="co-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="co-phone" className={label}>
              Téléphone
            </label>
            <input
              id="co-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+33 …"
              className={field}
            />
          </div>
        </div>

        <fieldset>
          <legend className={label}>Livraison</legend>
          <div className="mt-2 space-y-2">
            {zoneIds.map((id) => (
              <label
                key={id}
                className={`flex cursor-pointer items-center justify-between gap-3 border px-3 py-3 text-sm ${
                  zone === id ? "border-ivory" : "border-ivory/25"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="zone"
                    checked={zone === id}
                    onChange={() => setZone(id)}
                    className="accent-gold"
                  />
                  <span>
                    {zones[id].label}
                    <span className="block text-[11px] text-ivory/55">{zones[id].delay}</span>
                  </span>
                </span>
                <span>{formatPrice(zones[id].fee)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {zone === "europe" && (
          <div>
            <label htmlFor="co-country" className={label}>
              Pays
            </label>
            <select
              id="co-country"
              name="country"
              required
              autoComplete="country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={`${field} bg-brown`}
            >
              <option value="" disabled>
                Choisir un pays
              </option>
              {euCountries.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="co-address" className={label}>
            Adresse
          </label>
          <AddressInput country={zone === "france" ? "FR" : country} className={field} onPick={fillAddress} />
        </div>
        <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
          <div>
            <label htmlFor="co-postal" className={label}>
              Code postal
            </label>
            <input
              id="co-postal"
              name="postalCode"
              required
              autoComplete="postal-code"
              inputMode={zone === "france" ? "numeric" : "text"}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="co-city" className={label}>
              Ville
            </label>
            <input
              id="co-city"
              name="city"
              required
              autoComplete="address-level2"
              className={field}
            />
          </div>
        </div>
        <div>
          <label htmlFor="co-notes" className={label}>
            Précisions pour le transporteur (facultatif)
          </label>
          <textarea id="co-notes" name="notes" rows={2} maxLength={300} className={field} />
        </div>

        <p className="text-[11px] leading-relaxed text-ivory/55">
          Paiement sécurisé par carte bancaire (Visa, Mastercard, Apple Pay, Google Pay) sur la
          page de notre prestataire Stripe. Prix TTC.
        </p>

        <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-ivory/75">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
            className="mt-0.5 accent-gold"
          />
          <span>
            J&apos;ai lu et j&apos;accepte les{" "}
            <a href="/infos/cgv" target="_blank" rel="noreferrer" className="underline">
              conditions générales de vente
            </a>
            , dont le droit de rétractation de 14 jours.
          </span>
        </label>

        {!account && (
          <label className="flex cursor-pointer items-start gap-3 border border-ivory/15 p-3 text-xs leading-relaxed text-ivory/75">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(event) => setCreateAccount(event.target.checked)}
              className="mt-0.5 accent-gold"
            />
            <span>
              <span className="block text-ivory">Créer mon compte pour la prochaine fois</span>
              Suivi de mes commandes et coordonnées pré-remplies. Sans mot de passe : un code vous sera
              envoyé par e-mail après le paiement.
            </span>
          </label>
        )}
      </div>

      <div className="border-t border-ivory/15 px-6 py-5">
        <dl className="mb-4 space-y-1.5 text-[11px] uppercase tracking-[0.18em]">
          <div className="flex justify-between text-ivory/60">
            <dt>Pièces</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between text-ivory/60">
            <dt>Livraison</dt>
            <dd>{formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between text-sm tracking-[0.12em]">
            <dt>Total</dt>
            <dd>{formatPrice(total + shipping)}</dd>
          </div>
        </dl>
        {error && (
          <p role="alert" className="mb-3 text-xs text-gold">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || items.length === 0}
          className="tx-btn w-full bg-ivory px-4 py-3.5 text-brown hover:bg-ivory/85 disabled:opacity-50"
        >
          {busy ? "Redirection…" : "Payer"}
        </button>
      </div>
    </form>
  );
}
