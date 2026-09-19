import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-20 text-center">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">404</p>
      <h1 className="mt-4 font-serif text-4xl text-brown">
        Cette page n&apos;existe pas.
      </h1>
      <Link
        href="/"
        className="mt-8 text-[11px] uppercase tracking-[0.28em] text-brown-soft hover:text-brown"
      >
        Retour à la maison
      </Link>
    </div>
  );
}
