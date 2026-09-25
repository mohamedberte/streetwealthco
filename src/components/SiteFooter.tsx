import Link from "next/link";
import { brand } from "@/lib/brand";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-ivory/85">
      <div className="mx-auto max-w-[78rem] px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="space-y-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-muted">
              StreetWealth Co.
            </p>
            <Logo size="sm" />
            <p className="max-w-sm font-serif text-2xl leading-relaxed text-brown-soft">
              {brand.tagline}
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
              Street Chic · {brand.city}
            </p>
          </div>

          <div className="text-[11px] uppercase tracking-[0.2em] text-muted">
            <p className="mb-5 text-brown">Navigation</p>
            <ul className="space-y-3">
              <li>
                <Link href="/maison" className="hover:text-brown">
                  La Maison
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-brown">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/boutique" className="hover:text-brown">
                  Boutique privée
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brown">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-[11px] uppercase tracking-[0.2em] text-muted">
            <p className="mb-5 text-brown">Vision</p>
            <p>{brand.city}</p>
            <p className="mt-3 normal-case tracking-normal">{brand.email}</p>
            <p className="mt-6 max-w-sm normal-case tracking-normal leading-relaxed">
              StreetWealth Co. rapproche l&apos;énergie de la rue et l&apos;élégance
              des pièces premium. L&apos;objectif: transcender les frontières
              sociales avec un style urbain raffiné.
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-border/70 pt-5 text-center text-[10px] uppercase tracking-[0.28em] text-muted">
          © {new Date().getFullYear()} StreetWealth Co. — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}
