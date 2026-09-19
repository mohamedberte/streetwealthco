import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Boutique privée",
};

export default function BoutiquePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
        Boutique privée
      </p>
      <h1 className="mt-4 font-serif text-5xl text-brown">
        Les pièces du moment.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-brown-soft">
        Réservation d&apos;atelier. Paiement en ligne à venir — la sélection
        se conserve sur cet appareil.
      </p>
      <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              href={`/boutique/${product.slug}`}
              className="group block border border-border bg-ivory transition-colors hover:border-brown"
            >
              <div className="flex aspect-[4/5] items-end bg-cream px-6 py-6">
                <p className="font-serif text-4xl text-gold/50 transition-colors group-hover:text-gold">
                  ▲
                </p>
              </div>
              <div className="space-y-2 px-6 py-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                  {product.silhouette}
                </p>
                <h2 className="font-serif text-2xl text-brown">{product.name}</h2>
                <p className="text-sm text-brown-soft">{formatPrice(product.price)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
