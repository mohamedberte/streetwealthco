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
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
      <div className="flex min-h-[420px] items-end border border-border bg-ivory px-8 py-8">
        <p className="font-serif text-6xl text-gold/40">▲</p>
      </div>
      <div>
        <Link
          href="/boutique"
          className="text-[11px] uppercase tracking-[0.24em] text-muted hover:text-brown"
        >
          Retour à la boutique
        </Link>
        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-gold">
          {product.edition}
        </p>
        <h1 className="mt-3 font-serif text-5xl text-brown">{product.name}</h1>
        <p className="mt-4 text-lg text-brown-soft">{formatPrice(product.price)}</p>
        <p className="mt-8 leading-8 text-brown-soft">{product.description}</p>
        <ul className="mt-8 space-y-2 text-sm text-muted">
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
