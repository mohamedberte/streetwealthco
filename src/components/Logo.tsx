import Link from "next/link";

/**
 * Logotype TRIPLEX — Bebas Neue (police réservée au logo).
 * Si `href` est fourni, le logo devient un lien (accueil).
 */
export function Logo({
  className = "text-4xl sm:text-5xl",
  href,
  imageUrl,
}: {
  className?: string;
  href?: string;
  /** Logo importé depuis l'admin ; remplace le logotype texte. */
  imageUrl?: string | null;
}) {
  const mark = imageUrl ? (
    <span className={`inline-flex items-center leading-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="TRIPLEX" style={{ height: "1.1em", width: "auto" }} />
    </span>
  ) : (
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
