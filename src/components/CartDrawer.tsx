"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { useCart } from "@/components/CartProvider";

export function CartButton() {
  const { count, setOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="text-brown-soft transition-colors hover:text-brown"
      aria-label="Ouvrir le panier"
    >
      Panier{count > 0 ? ` (${count})` : ""}
    </button>
  );
}

export function CartDrawer() {
  const { items, open, setOpen, removeItem, clear, total } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-brown/36 backdrop-blur-sm"
        aria-label="Fermer le panier"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-brown">
            Votre sélection
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] uppercase tracking-[0.2em] text-muted hover:text-brown"
          >
            Fermer
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <p className="font-serif text-xl text-brown-soft">
              Le panier est encore silencieux.
            </p>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li
                  key={`${item.slug}-${item.size}`}
                  className="border-b border-border/70 pb-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-lg text-brown">{item.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted">
                        Taille {item.size} · {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm text-brown">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug, item.size)}
                    className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-brown"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border px-6 py-6">
          <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em]">
            <span className="text-muted">Total</span>
            <span className="text-brown">{formatPrice(total)}</span>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-muted">
            Paiement à venir. Pour l&apos;heure, la sélection est conservée sur
            cet appareil.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={clear}
              className="flex-1 border border-border px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-brown-soft hover:border-brown"
            >
              Vider
            </button>
            <Link
              href="/boutique"
              onClick={() => setOpen(false)}
              className="flex-1 bg-brand px-4 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-ivory hover:bg-brand/88"
            >
              Boutique
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
