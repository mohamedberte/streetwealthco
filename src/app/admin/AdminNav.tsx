"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; badge?: number; alert?: boolean };

/** Navigation de l'administration : une section = une tâche. */
export function AdminNav({
  toShip,
  refundNeeded,
  logout,
}: {
  toShip: number;
  refundNeeded: number;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const urgent = toShip + refundNeeded;
  const tabs: Tab[] = [
    { href: "/admin", label: "Accueil" },
    { href: "/admin/commandes", label: "Commandes", badge: urgent, alert: refundNeeded > 0 },
    { href: "/admin/produits", label: "Pièces et stock" },
    { href: "/admin/contenu", label: "Contenu du site" },
  ];
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="-mx-6 mb-10 flex items-center justify-between gap-4 border-b border-border px-6 sm:-mx-10 sm:px-10">
      <nav aria-label="Administration" className="-mb-px flex gap-6 overflow-x-auto sm:gap-8">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 border-b-2 py-4 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                active ? "border-brown text-brown" : "border-transparent text-muted hover:text-brown"
              }`}
            >
              {tab.label}
              {tab.badge ? (
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] leading-none tracking-normal ${
                    tab.alert ? "bg-gold text-white" : "bg-brown text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <form action={logout} className="shrink-0">
        <button
          type="submit"
          className="text-[11px] uppercase tracking-[0.2em] text-muted hover:text-brown"
        >
          Quitter
        </button>
      </form>
    </div>
  );
}
