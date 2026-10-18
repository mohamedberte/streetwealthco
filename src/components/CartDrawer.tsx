"use client";

import { useEffect, useState } from "react";
import { Checkout } from "@/components/Checkout";
import { CodeLogin } from "@/components/CodeLogin";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/products";
import { policy } from "@/lib/shipping";

export function CartButton() {
  const { count, setOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="uppercase tracking-[0.16em] opacity-80 transition-opacity hover:opacity-100 sm:tracking-[0.24em]"
      aria-label="Ouvrir la sélection"
    >
      Sélection{count > 0 ? ` (${count})` : ""}
    </button>
  );
}

export function CartDrawer() {
  const { open } = useCart();
  return open ? <CartPanel /> : null;
}

function CartPanel() {
  const { items, setOpen, removeItem, changeQuantity, clear, total } = useCart();
  const [view, setView] = useState<"cart" | "checkout" | "login">("cart");
  const step = view !== "cart" && items.length === 0 ? "cart" : view;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Sélection">
      <button
        type="button"
        className="absolute inset-0 bg-brown/60 backdrop-blur-sm"
        aria-label="Fermer la sélection"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-ivory/15 bg-brown text-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-ivory/15 px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.28em]">
            {step === "cart" ? "Votre sélection" : step === "login" ? "Connexion" : "Finaliser la commande"}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] uppercase tracking-[0.2em] text-ivory/60 hover:text-ivory"
          >
            Fermer
          </button>
        </div>

        {step === "checkout" ? (
          <Checkout onBack={() => setView("cart")} onLogin={() => setView("login")} />
        ) : step === "login" ? (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <button
              type="button"
              onClick={() => setView("checkout")}
              className="text-[10px] uppercase tracking-[0.2em] text-ivory/60 hover:text-ivory"
            >
              ← Retour à la commande
            </button>
            <p className="mt-5 text-sm leading-relaxed text-ivory/70">
              Entrez votre e-mail : un code vous est envoyé et vos coordonnées sont pré-remplies. Votre
              sélection est conservée.
            </p>
            <div className="mt-6 bg-ivory p-5 text-brown">
              <CodeLogin onDone={() => setView("checkout")} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <p className="font-serif text-2xl text-ivory/70">
                  Votre sélection est vide pour l&apos;instant.
                </p>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li
                      key={`${item.slug}-${item.size}`}
                      className="border-b border-ivory/10 pb-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-serif text-xl">{item.name}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ivory/55">
                            Taille {item.size}
                          </p>
                        </div>
                        <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm">
                          <button
                            type="button"
                            aria-label="Retirer une unité"
                            disabled={item.quantity <= 1}
                            onClick={() => changeQuantity(item.slug, item.size, -1)}
                            className="h-7 w-7 border border-ivory/25 hover:border-ivory disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="w-4 text-center tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Ajouter une unité"
                            disabled={item.quantity >= policy.maxQuantity}
                            onClick={() => changeQuantity(item.slug, item.size, 1)}
                            className="h-7 w-7 border border-ivory/25 hover:border-ivory disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.slug, item.size)}
                          className="text-[10px] uppercase tracking-[0.2em] text-ivory/55 hover:text-ivory"
                        >
                          Retirer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {items.length > 0 && (
                <p className="mt-6 text-[11px] leading-relaxed text-ivory/50">
                  {policy.maxQuantity} exemplaires maximum par pièce et par taille. Les frais de
                  livraison sont calculés à l&apos;étape suivante.
                </p>
              )}
            </div>

            <div className="border-t border-ivory/15 px-6 py-6">
              <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em]">
                <span className="text-ivory/55">Sous-total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clear}
                  disabled={items.length === 0}
                  className="tx-btn flex-1 px-4 py-3 disabled:opacity-40"
                >
                  Vider
                </button>
                <button
                  type="button"
                  onClick={() => setView("checkout")}
                  disabled={items.length === 0}
                  className="tx-btn flex-1 bg-ivory px-4 py-3 text-center text-brown hover:bg-ivory/85 disabled:opacity-40"
                >
                  Commander
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
