import type { Metadata } from "next";
import Link from "next/link";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Collections",
};

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
        Collections
      </p>
      <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-tight text-brown">
        Silhouettes d&apos;atelier, éditions mesurées.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-brown-soft">
        Aperçu public. Les disponibilités, tailles et réservations se
        trouvent dans la boutique privée.
      </p>
      <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.slug} className="border border-border bg-ivory p-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
              {product.silhouette}
            </p>
            <h2 className="mt-4 font-serif text-2xl text-brown">
              {product.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-brown-soft">
              {product.edition}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-16 text-center">
        <Link
          href="/boutique"
          className="text-[11px] uppercase tracking-[0.28em] text-gold hover:text-brown"
        >
          Entrer dans la boutique
        </Link>
      </p>
    </div>
  );
}
