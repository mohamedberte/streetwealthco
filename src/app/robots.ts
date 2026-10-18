import type { MetadataRoute } from "next";
import { siteUrl } from "@/server/emails";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/commande", "/api"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
