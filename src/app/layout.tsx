import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Cormorant_Garamond, Outfit } from "next/font/google";
import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/components/CartProvider";
import { brand } from "@/lib/brand";
import "./globals.css";

const sans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const serif = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Police réservée au logotype. */
const display = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${brand.name} — Exposition`,
    template: `%s — ${brand.name}`,
  },
  description: brand.tagline,
  openGraph: {
    title: brand.name,
    description: brand.tagline,
    siteName: brand.name,
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#24150F",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${sans.variable} ${serif.variable} ${display.variable} h-full antialiased`}
    >
      <body className="h-full font-sans">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
