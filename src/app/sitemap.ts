import type { MetadataRoute } from "next";
import { getCatalog } from "@/server/catalog";
import { getPages } from "@/server/content";
import { siteUrl } from "@/server/emails";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [catalog, pages] = await Promise.all([getCatalog(), getPages()]);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...catalog.map((product) => ({
      url: `${base}/?piece=${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...pages.map((page) => ({
      url: `${base}/infos/${page.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
