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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-ivory/85 backdrop-blur-xl">
      <div className="border-b border-border/60 px-4 py-2 text-center text-[9px] uppercase tracking-[0.26em] text-muted sm:px-6 sm:text-[10px] sm:tracking-[0.28em]">
        Rue + Élégance · Éditions limitées · Paris
      </div>
      <div className="mx-auto max-w-[78rem] px-4 py-4 sm:px-6">
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.24em] text-brown-soft md:flex">
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
          <div className="justify-self-center">
            <Logo size="sm" />
          </div>
          <div className="flex items-center justify-end gap-4 text-[10px] uppercase tracking-[0.2em] sm:gap-6 sm:text-[11px] sm:tracking-[0.24em]">
            <Link
              href="/boutique"
              className="text-gold transition-colors hover:text-brown"
            >
              Boutique privée
            </Link>
            <CartButton />
          </div>
        </div>
        <nav className="mt-4 flex items-center gap-6 overflow-x-auto border-t border-border/60 pt-3 text-[10px] uppercase tracking-[0.22em] whitespace-nowrap text-brown-soft md:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brown">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
