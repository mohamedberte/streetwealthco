import type { Metadata } from "next";
import { Exhibition, type Availability } from "@/components/Exhibition";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/lib/brand";
import type { Product } from "@/lib/products";
import { getCatalog, getProduct } from "@/server/catalog";
import { getPages, getSettings } from "@/server/content";
import { getAvailability } from "@/server/inventory";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function pieceParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const piece = await getProduct(pieceParam((await searchParams).piece) ?? "");
  if (!piece) return {};
  return {
    title: piece.name,
    description: `${piece.name} — ${piece.silhouette}. ${brand.tagline}`,
  };
}

/** Sans base de données (développement), on affiche le stock initial. */
async function loadAvailability(products: Product[]): Promise<Availability> {
  try {
    return await getAvailability();
  } catch (error) {
    console.warn("[availability] base indisponible, stock initial affiché :", error);
    return Object.fromEntries(
      products.map((product) => [
        product.slug,
        Object.fromEntries(product.sizes.map((size) => [size, product.stockPerSize])),
      ]),
    );
  }
}

export default async function Home({ searchParams }: Props) {
  const [params, products, pages, settings] = await Promise.all([
    searchParams,
    getCatalog(),
    getPages(),
    getSettings(),
  ]);

  if (products.length === 0) {
    return (
      <PageShell>
        <h1 className="font-serif text-4xl sm:text-6xl">Bientôt.</h1>
        <p className="mt-6 text-sm text-brown-soft">{settings.tagline}</p>
      </PageShell>
    );
  }

  const availability = await loadAvailability(products);
  return (
    <Exhibition
      products={products}
      availability={availability}
      initialSlug={pieceParam(params.piece)}
      pages={pages.map(({ slug, title }) => ({ slug, title }))}
      tagline={settings.tagline}
      logoUrl={settings.logoUrl}
    />
  );
}
