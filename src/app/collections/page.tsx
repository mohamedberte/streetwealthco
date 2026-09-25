import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Collections",
};

const visuals = [
  "/visuals/rework-chapter-a.svg",
  "/visuals/rework-chapter-b.svg",
  "/visuals/rework-chapter-c.svg",
];

export default function CollectionsPage() {
  return (
    <div className="overflow-x-clip">
      <section data-parallax-root className="relative isolate min-h-[64svh] overflow-hidden border-b border-border/70">
        <div className="absolute inset-0">
          <Image
            src="/visuals/rework-panorama.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            data-zoom="1.08"
            className="sw-cinematic-media object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(24,19,15,0.22)_4%,rgba(24,19,15,0.66)_86%)]" />

        <div className="relative mx-auto flex min-h-[64svh] max-w-[86rem] items-end px-4 pb-12 pt-20 sm:px-6 sm:pb-16">
          <div data-reveal className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ivory/88">
              Collections
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ivory sm:text-6xl">
              Streetwear chic,
              <br />
              capsules mesurées.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/84">
              Aperçu public du vestiaire: hoodies, tees, pulls, polos et
              essentiels urbains raffinés.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[86rem] px-4 py-14 sm:px-6 sm:py-20">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <li
              key={product.slug}
              data-reveal
              data-reveal-delay={((index % 3) * 0.09).toFixed(2)}
              data-drift
              className="group relative isolate min-h-[24rem] overflow-hidden rounded-[1.2rem] border border-border/70"
            >
              <Image
                src={visuals[index % visuals.length]}
                alt={product.name}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 33vw"
                data-zoom="1.08"
                className="sw-cinematic-media object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(176deg,rgba(22,18,15,0.08)_8%,rgba(22,18,15,0.78)_88%)]" />

              <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-7">
                <p className="text-[11px] uppercase tracking-[0.22em] text-ivory/78">
                  {product.silhouette}
                </p>
                <h2 className="mt-4 font-serif text-2xl text-ivory">
                  {product.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-ivory/84">
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
      </section>
    </div>
  );
}
