import Link from "next/link";
import { brand } from "@/lib/brand";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
        <div className="space-y-4">
          <Logo size="sm" />
          <p className="max-w-xs font-serif text-lg leading-relaxed text-brown-soft">
            {brand.tagline}
          </p>
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted">
          <p className="mb-4 text-brown">Parcourir</p>
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
          <p className="mb-4 text-brown">Atelier</p>
          <p>{brand.city}</p>
          <p className="mt-3 normal-case tracking-normal">{brand.email}</p>
          <p className="mt-6 max-w-xs normal-case tracking-normal leading-relaxed">
            Accès boutique sur invitation. Les pièces sont éditées en quantités
            limitées.
          </p>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5 text-center text-[10px] uppercase tracking-[0.28em] text-muted">
        © {new Date().getFullYear()} StreetWealth Co. — Tous droits réservés
      </div>
    </footer>
  );
}
