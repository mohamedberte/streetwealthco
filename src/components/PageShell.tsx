import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/lib/brand";

/** Coque des pages secondaires (le body est en overflow hidden : on défile ici). */
export function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-cream text-brown">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
        <Logo href="/" className="text-3xl sm:text-4xl" />
        <Link
          href="/"
          className="text-[11px] uppercase tracking-[0.24em] text-brown-soft hover:text-brown"
        >
          ← Exposition
        </Link>
      </header>
      <main className={`mx-auto px-6 pb-24 pt-8 sm:px-10 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        {children}
      </main>
      <footer className="border-t border-border px-6 py-8 text-[11px] uppercase tracking-[0.2em] text-muted sm:px-10">
        {brand.name} · {brand.city}, {brand.country}
      </footer>
    </div>
  );
}
