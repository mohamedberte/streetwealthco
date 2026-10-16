import Link from "next/link";

/**
 * Logotype TRIPLEX — Bebas Neue (police réservée au logo).
 * Si `href` est fourni, le logo devient un lien (accueil).
 */
export function Logo({
  className = "text-4xl sm:text-5xl",
  href,
}: {
  className?: string;
  href?: string;
}) {
  const mark = (
    <span
      className={`font-display leading-none tracking-[0.18em] ${className}`}
      aria-label="TRIPLEX"
    >
      TRIPLE<span className="text-gold">X</span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="TRIPLEX — accueil">
      {mark}
    </Link>
  ) : (
    mark
  );
}
