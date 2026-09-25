import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-lg tracking-[0.12em]",
  md: "text-xl tracking-[0.16em] sm:text-2xl",
  lg: "text-3xl tracking-[0.18em] sm:text-4xl",
};

export function Logo({ href, className = "", size = "md" }: LogoProps) {
  const mark = (
    <span
      className={`font-serif font-medium text-brown ${sizes[size]} ${className}`}
    >
      StreetWe
      <span className="relative inline-block px-[0.12em] text-brand" aria-hidden>
        ▲
      </span>
      lth Co.
    </span>
  );

  const destination = href ?? "/";

  return (
    <Link href={destination} className="inline-flex items-baseline" aria-label="StreetWealth Co.">
      {mark}
    </Link>
  );
}
