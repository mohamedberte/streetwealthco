import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { formatPrice, getProduct, products } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Pièce introuvable" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const index = products.findIndex((item) => item.slug === product.slug);
  const visuals = [
    "/visuals/rework-chapter-a.svg",
    "/visuals/rework-chapter-b.svg",
    "/visuals/rework-chapter-c.svg",
  ];

  return (
    <div className="mx-auto grid max-w-[86rem] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1fr]">
      <div
        data-reveal
        data-drift
        className="group relative isolate min-h-[360px] overflow-hidden rounded-[1.2rem] border border-border/70 sm:min-h-[470px]"
      >
        <Image
          src={visuals[index % visuals.length]}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          data-zoom="1.08"
          className="sw-cinematic-media object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(178deg,rgba(22,18,15,0.12)_8%,rgba(22,18,15,0.72)_88%)]" />
        <div className="absolute bottom-0 left-0 right-0 px-8 py-8 sm:px-10 sm:py-10">
          <p className="font-serif text-7xl text-ivory/68">▲</p>
        </div>
      </div>

      <div
        data-reveal
        data-reveal-delay="0.12"
        data-drift
        className="sw-panel p-8 sm:p-10"
      >
        <Link
          href="/boutique"
          className="text-[11px] uppercase tracking-[0.24em] text-muted hover:text-brown"
        >
          Retour à la boutique
        </Link>
        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-brand">
          {product.edition}
        </p>
        <h1 className="mt-3 font-serif text-4xl text-brown sm:text-5xl">{product.name}</h1>
        <p className="mt-4 text-lg text-brown-soft">{formatPrice(product.price)}</p>
        <p className="mt-8 leading-8 text-brown-soft">{product.description}</p>
        <ul className="mt-8 space-y-2 text-sm leading-7 text-muted">
          {product.details.map((detail) => (
            <li key={detail}>— {detail}</li>
          ))}
          <li>— {product.fabric}</li>
        </ul>
        <div className="mt-10">
          <AddToCart slug={product.slug} name={product.name} price={product.price} />
        </div>
      </div>
    </div>
  );
}
