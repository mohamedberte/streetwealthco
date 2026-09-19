"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";

const sizes = ["XS", "S", "M", "L", "XL"];

type AddToCartProps = {
  slug: string;
  name: string;
  price: number;
};

export function AddToCart({ slug, name, price }: AddToCartProps) {
  const { addItem } = useCart();
  const [size, setSize] = useState("M");

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        addItem({ slug, name, price, size });
      }}
    >
      <fieldset>
        <legend className="mb-3 text-[11px] uppercase tracking-[0.22em] text-muted">
          Taille
        </legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((value) => (
            <label
              key={value}
              className={`cursor-pointer border px-4 py-2 text-[11px] tracking-[0.16em] ${
                size === value
                  ? "border-brown bg-brown text-ivory"
                  : "border-border text-brown hover:border-brown"
              }`}
            >
              <input
                type="radio"
                name="size"
                value={value}
                checked={size === value}
                onChange={() => setSize(value)}
                className="sr-only"
              />
              {value}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        className="w-full bg-brown px-6 py-4 text-[11px] uppercase tracking-[0.28em] text-ivory transition-colors hover:bg-brown-soft"
      >
        Réserver la pièce
      </button>
    </form>
  );
}
