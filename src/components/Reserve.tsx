"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";

type ReserveProps = {
  slug: string;
  name: string;
  price: number;
  sizes: string[];
};

export function Reserve({ slug, name, price, sizes }: ReserveProps) {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 2400);
    return () => window.clearTimeout(timer);
  }, [done]);

  function add(size: string) {
    addItem({ slug, name, price, size });
    setOpen(false);
    setDone(true);
  }

  const single = sizes.length === 1;

  return (
    <div data-nodrag className="relative">
      {open && !single && (
        <div
          role="group"
          aria-label={`Taille — ${name}`}
          className="absolute bottom-full right-0 mb-3 flex gap-2"
        >
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => add(size)}
              className="tx-btn min-w-11 px-3 py-2.5 text-center tracking-[0.14em]"
            >
              {size}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-expanded={single ? undefined : open}
        onClick={() => (single ? add(sizes[0]) : setOpen((value) => !value))}
        className="tx-btn w-full sm:w-auto"
      >
        {done ? "Ajoutée à la sélection" : open ? "Choisir une taille" : "Réserver"}
      </button>
    </div>
  );
}
