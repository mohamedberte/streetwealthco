import type { Metadata } from "next";
import { Exhibition, type Availability } from "@/components/Exhibition";
import { brand } from "@/lib/brand";
import { getProduct, products } from "@/lib/products";
import { getAvailability } from "@/server/inventory";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function pieceParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const piece = getProduct(pieceParam((await searchParams).piece) ?? "");
  if (!piece) return {};
  return {
    title: piece.name,
    description: `${piece.name} — ${piece.silhouette}. ${brand.tagline}`,
  };
}

/** Sans base de données (développement), on affiche le stock initial. */
async function loadAvailability(): Promise<Availability> {
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
  const [params, availability] = await Promise.all([searchParams, loadAvailability()]);
  return (
    <Exhibition availability={availability} initialSlug={pieceParam(params.piece)} />
  );
}
