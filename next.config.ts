import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Le jeton de suivi de commande est dans l'URL : on ne le transmet jamais en referrer.
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' https://checkout.stripe.com",
  },
];

// Pages privees : jamais indexees ni mises en cache.
const privateHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "no-store, max-age=0" },
];

// Images des pieces : servies par CloudFront (CLOUDFRONT_URL), a autoriser pour next/image.
function cloudfrontPattern() {
  try {
    const url = new URL(process.env.CLOUDFRONT_URL ?? "");
    if (url.protocol !== "https:") return [];
    return [{ protocol: "https" as const, hostname: url.hostname, pathname: "/**" }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: cloudfrontPattern() },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/commande/:path*", headers: privateHeaders },
      { source: "/compte/:path*", headers: privateHeaders },
    ];
  },
};

export default nextConfig;
