import type { Metadata } from "next";
import { Exhibition, type Availability } from "@/components/Exhibition";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/lib/brand";
import { formatPrice, isUpcoming, type Product } from "@/lib/products";
import { getCatalog, getProduct } from "@/server/catalog";
import { getPages, getSettings } from "@/server/content";
import { getAvailability } from "@/server/inventory";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function pieceParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function baseUrl() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Données structurées : `<` échappé pour qu'aucun contenu ne ferme la balise script. */
function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const piece = await getProduct(pieceParam((await searchParams).piece) ?? "");
  if (!piece) return { alternates: { canonical: "/" } };

  const title = `${piece.name} — ${brand.name}`;
  const description = `${piece.name} — ${piece.silhouette}, ${formatPrice(piece.price)}. ${piece.description}`;
  const path = `/?piece=${piece.slug}`;
  const image = `/og/${piece.slug}`;
  return {
    title: piece.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: brand.name,
      locale: "fr_FR",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: piece.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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
  const base = baseUrl();
  const piece = products.find((item) => item.slug === pieceParam(params.piece));
  const structured = piece
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: piece.name,
        description: piece.description,
        image: piece.image ? new URL(piece.image, base).href : `${base}/og/${piece.slug}`,
        brand: { "@type": "Brand", name: brand.name },
        material: piece.fabric,
        offers: {
          "@type": "Offer",
          url: `${base}/?piece=${piece.slug}`,
          priceCurrency: "EUR",
          price: piece.price,
          availability: isUpcoming(piece)
            ? "https://schema.org/PreOrder"
            : Object.values(availability[piece.slug] ?? {}).some((qty) => qty > 0)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: brand.name,
        url: base,
        logo: `${base}/pwa/512`,
        description: settings.tagline,
      };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <Exhibition
        products={products}
        availability={availability}
        initialSlug={pieceParam(params.piece)}
        pages={pages.map(({ slug, title }) => ({ slug, title }))}
        tagline={settings.tagline}
        logoUrl={settings.logoUrl}
        serverNow={Date.now()}
      />
    </>
  );
}
