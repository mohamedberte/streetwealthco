"use client";

import { useEffect, useState } from "react";
import { joinWaitlist } from "@/app/actions";
import { useCart } from "@/components/CartProvider";
import { policy } from "@/lib/shipping";

type ReserveProps = {
  slug: string;
  name: string;
  price: number;
  sizes: string[];
  /** Stock disponible par taille. */
  available: Record<string, number>;
};

export function Reserve({ slug, name, price, sizes, available }: ReserveProps) {
  const { items, addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [waitSize, setWaitSize] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [waitState, setWaitState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [waitError, setWaitError] = useState("");

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 2400);
    return () => window.clearTimeout(timer);
  }, [done]);

  const total = sizes.reduce((sum, size) => sum + (available[size] ?? 0), 0);
  const soldOut = total === 0;
  const single = sizes.length === 1;

  const inCart = (size: string) =>
    items.find((item) => item.slug === slug && item.size === size)?.quantity ?? 0;
  const canAdd = (size: string) =>
    (available[size] ?? 0) - inCart(size) > 0 && inCart(size) < policy.maxQuantity;

  function add(size: string) {
    addItem({ slug, name, price, size });
    setOpen(false);
    setDone(true);
  }

  function openWaitlist(size: string) {
    setOpen(false);
    setWaitSize(size);
    setWaitState("idle");
    setWaitError("");
  }

  function onMain() {
    if (soldOut && single) return openWaitlist(sizes[0]);
    if (single) return add(sizes[0]);
    setWaitSize(null);
    setOpen((value) => !value);
  }

  async function submitWaitlist(event: React.FormEvent) {
    event.preventDefault();
    if (!waitSize) return;
    setWaitState("sending");
    const result = await joinWaitlist({ slug, size: waitSize, email });
    if (result.ok) {
      setWaitState("ok");
    } else {
      setWaitState("error");
      setWaitError(result.error ?? "Inscription impossible.");
    }
  }

  const label = done
    ? "Ajoutée à la sélection"
    : soldOut
      ? "Épuisé — me prévenir"
      : open
        ? "Choisir une taille"
        : "Commander";

  const panel =
    "absolute bottom-full right-0 mb-3 border border-current/30 bg-current/10 backdrop-blur-md";

  return (
    <div data-nodrag className="relative">
      {open && !single && (
        <div
          role="group"
          aria-label={`Taille — ${name}`}
          className={`${panel} flex gap-2 p-2`}
        >
          {sizes.map((size) => {
            const out = (available[size] ?? 0) <= 0;
            const blocked = !out && !canAdd(size);
            return (
              <button
                key={size}
                type="button"
                disabled={blocked}
                onClick={() => (out ? openWaitlist(size) : add(size))}
                title={out ? "Épuisé — être prévenu du retour" : undefined}
                className={`tx-btn min-w-11 px-3 py-2.5 text-center tracking-[0.14em] ${
                  out ? "line-through opacity-50" : ""
                } ${blocked ? "opacity-30" : ""}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      )}

      {waitSize && (
        <form onSubmit={submitWaitlist} className={`${panel} w-72 p-4`}>
          {waitState === "ok" ? (
            <p className="text-sm leading-relaxed">
              C&apos;est noté. Vous serez prévenu par e-mail si la taille {waitSize} revient.
            </p>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.2em]">
                Taille {waitSize} épuisée
              </p>
              <p className="mt-2 text-xs leading-relaxed opacity-75">
                Laissez votre e-mail : vous serez prévenu en priorité en cas de retour.
              </p>
              <label className="sr-only" htmlFor={`wait-${slug}`}>
                Adresse e-mail
              </label>
              <input
                id={`wait-${slug}`}
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                className="mt-3 w-full border border-current/40 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:opacity-50 focus:border-current"
              />
              {waitState === "error" && (
                <p role="alert" className="mt-2 text-xs">
                  {waitError}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={waitState === "sending"}
                  className="tx-btn flex-1 px-4 py-2.5 disabled:opacity-50"
                >
                  Me prévenir
                </button>
                <button
                  type="button"
                  onClick={() => setWaitSize(null)}
                  className="tx-btn px-4 py-2.5"
                >
                  Fermer
                </button>
              </div>
            </>
          )}
        </form>
      )}

      <button
        type="button"
        aria-expanded={single ? undefined : open}
        onClick={onMain}
        className="tx-btn w-full sm:w-auto"
      >
        {label}
      </button>
    </div>
  );
}
