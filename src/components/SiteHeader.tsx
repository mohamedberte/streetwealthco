import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CartButton } from "@/components/CartDrawer";

const nav = [
  { href: "/maison", label: "La Maison" },
  { href: "/collections", label: "Collections" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <nav className="hidden items-center gap-7 text-[11px] uppercase tracking-[0.22em] text-brown-soft md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-brown"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Logo size="sm" />
        <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.22em]">
          <Link
            href="/boutique"
            className="text-gold transition-colors hover:text-brown"
          >
            Boutique privée
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
