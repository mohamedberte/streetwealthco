"use client";

import Link from "next/link";
import { useEffect } from "react";
import { legalPages } from "@/lib/legal";

export function InfoPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    <div
      data-nodrag
      className="fixed inset-0 z-50 bg-brown text-ivory"
      role="dialog"
      aria-modal="true"
      aria-label="Informations"
    >
      <div className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <p className="text-[11px] uppercase tracking-[0.28em]">Informations</p>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] uppercase tracking-[0.24em] text-ivory/60 hover:text-ivory"
        >
          Fermer
        </button>
      </div>
      <nav className="flex h-[calc(100%-5rem)] flex-col justify-center px-6 sm:px-10">
        <ul className="space-y-1">
          {legalPages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/infos/${page.slug}`}
                className="block py-1.5 font-serif text-3xl text-ivory/80 transition-colors hover:text-gold sm:text-5xl"
              >
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
