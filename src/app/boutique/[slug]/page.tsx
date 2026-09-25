import type { Metadata } from "next";
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

  return (
    <div className="mx-auto grid max-w-[78rem] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1fr]">
      <div data-reveal data-drift className="sw-panel flex min-h-[360px] items-end px-8 py-8 sm:min-h-[470px] sm:px-10 sm:py-10">
        <p className="font-serif text-7xl text-brand/40">▲</p>
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
