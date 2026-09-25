import type { Metadata } from "next";
import Link from "next/link";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Collections",
};

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-[78rem] px-4 py-16 sm:px-6 sm:py-20">
      <div data-reveal className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
          Collections
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-brown sm:text-6xl">
          Streetwear chic, capsules mesurées.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-brown-soft">
          Aperçu public de notre vestiaire: hoodies, tees, pulls, polos et
          essentiels urbains raffinés.
        </p>
      </div>

      <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <li
            key={product.slug}
            data-reveal
            data-reveal-delay={((index % 3) * 0.09).toFixed(2)}
            data-drift
            className="sw-panel overflow-hidden"
          >
            <div className="flex aspect-[4/3] items-end border-b border-border/70 bg-brand/14 px-6 py-6 sm:px-7">
              <p className="font-serif text-4xl text-brand/50">▲</p>
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                {product.silhouette}
              </p>
              <h2 className="mt-4 font-serif text-2xl text-brown">
                {product.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-brown-soft">
                {product.edition}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p data-reveal className="mt-16 text-center">
        <Link
          href="/boutique"
          className="text-[11px] uppercase tracking-[0.28em] text-brand hover:text-brown"
        >
          Entrer dans la boutique privée
        </Link>
      </p>
    </div>
  );
}
