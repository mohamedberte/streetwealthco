"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Menu compact ancré sous le bouton « Informations » : la scène reste visible. */
export function InfoPanel({
  open,
  onClose,
  pages,
}: {
  open: boolean;
  onClose: () => void;
  pages: { slug: string; title: string }[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div data-nodrag aria-hidden className="fixed inset-0 z-40" onClick={onClose} />
      <div
        data-nodrag
        className="fixed right-6 top-[4.5rem] z-50 w-[min(18rem,calc(100vw-3rem))] border border-ivory/15 bg-brown p-5 text-ivory shadow-xl sm:right-10 sm:top-24"
        role="dialog"
        aria-label="Informations"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.28em] text-ivory/60">Informations</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-sm leading-none text-ivory/60 hover:text-ivory"
          >
            ✕
          </button>
        </div>
        <ul className="mt-3 divide-y divide-ivory/10">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/infos/${page.slug}`}
                className="block py-2 text-sm text-ivory/85 transition-colors hover:text-gold"
              >
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
