"use client";

import { useEffect, useRef, useState } from "react";

/** Partage le lien direct de la pièce (feuille de partage du système, sinon copie dans le presse-papiers). */
export function ShareButton({ slug, name }: { slug: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    const url = `${window.location.origin}/?piece=${slug}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copiez le lien de la pièce :", url);
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  }

  return (
    <button
      type="button"
      data-reveal
      onClick={share}
      aria-label={`Partager ${name}`}
      className="mt-4 block text-[10px] uppercase tracking-[0.26em] underline decoration-current/40 underline-offset-8 transition-opacity hover:decoration-current"
    >
      <span aria-live="polite">{copied ? "Lien copié" : "Partager"}</span>
    </button>
  );
}
