import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/components/CartProvider";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
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

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s — ${brand.name}`,
  },
  description: brand.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="sw-body flex min-h-full flex-col font-sans text-brown">
        <CartProvider>
          <div aria-hidden className="sw-scroll-progress" />
          <ScrollReveal />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
