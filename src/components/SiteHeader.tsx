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
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
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
          <div className="flex w-full items-center justify-center gap-5 text-[10px] uppercase tracking-[0.2em] sm:gap-6 sm:text-[11px] sm:tracking-[0.24em] md:w-auto md:justify-end">
            <Link
              href="/boutique"
              className="border-b border-transparent text-gold transition-colors hover:border-gold/60 hover:text-brown"
            >
              Boutique privée
            </Link>
            <CartButton />
          </div>
        </div>
        <nav className="mt-4 grid grid-cols-3 items-center border-t border-border/60 pt-3 text-center text-[10px] uppercase tracking-[0.22em] text-brown-soft md:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="py-1 hover:text-brown">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
