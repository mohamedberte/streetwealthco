"use client";

import { useCart } from "@/components/CartProvider";
import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/products";

export function CartButton() {
  const { count, setOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="uppercase tracking-[0.24em] opacity-80 transition-opacity hover:opacity-100"
      aria-label="Ouvrir la sélection"
    >
      Sélection{count > 0 ? ` (${count})` : ""}
    </button>
  );
}

export function CartDrawer() {
  const { items, open, setOpen, removeItem, clear, total } = useCart();

  if (!open) return null;

  const subject = encodeURIComponent(`Réservation ${brand.name}`);
  const body = encodeURIComponent(
    [
      "Bonjour,",
      "",
      "Je souhaite réserver :",
      ...items.map(
        (item) =>
          `- ${item.name} — taille ${item.size} × ${item.quantity} (${formatPrice(item.price * item.quantity)})`,
      ),
      "",
      `Total : ${formatPrice(total)}`,
    ].join("\n"),
  );

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-brown/60 backdrop-blur-sm"
        aria-label="Fermer la sélection"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-ivory/15 bg-brown text-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-ivory/15 px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.28em]">Votre sélection</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] uppercase tracking-[0.2em] text-ivory/60 hover:text-ivory"
          >
            Fermer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <p className="font-serif text-2xl text-ivory/70">
              Aucune pièce réservée pour l&apos;instant.
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
                        Taille {item.size} · {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug, item.size)}
                    className="mt-3 text-[10px] uppercase tracking-[0.2em] text-ivory/55 hover:text-ivory"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-ivory/15 px-6 py-6">
          <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em]">
            <span className="text-ivory/55">Total</span>
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
            <a
              href={`mailto:${brand.email}?subject=${subject}&body=${body}`}
              aria-disabled={items.length === 0}
              className={`tx-btn flex-1 bg-ivory px-4 py-3 text-center text-brown hover:bg-ivory/85 ${
                items.length === 0 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Envoyer
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
