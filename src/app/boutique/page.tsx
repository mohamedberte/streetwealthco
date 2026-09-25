import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Boutique privée",
};

export default function BoutiquePage() {
  return (
    <div className="mx-auto max-w-[78rem] px-4 py-16 sm:px-6 sm:py-20">
      <div data-reveal className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
          Boutique privée
        </p>
        <h1 className="mt-4 font-serif text-4xl text-brown sm:text-6xl">
          Les pièces du moment.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-brown-soft">
          Capsules actives du moment. Paiement en ligne à venir: votre
          sélection reste conservée sur cet appareil.
        </p>
      </div>

      <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <li
            key={product.slug}
            data-reveal
            data-reveal-delay={((index % 3) * 0.09).toFixed(2)}
            data-drift
          >
            <Link
              href={`/boutique/${product.slug}`}
              className="group sw-panel block overflow-hidden transition-colors hover:border-brown"
            >
              <div className="flex aspect-[4/5] items-end border-b border-border/70 bg-brand/14 px-6 py-6 sm:px-7 sm:py-7">
                <p className="font-serif text-5xl text-brand/50 transition-colors group-hover:text-brand">
                  ▲
                </p>
              </div>
              <div className="space-y-2 p-6 sm:p-7">
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
