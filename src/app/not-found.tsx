import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[62vh] max-w-2xl flex-col justify-center px-6 py-20">
      <div data-reveal data-drift className="sw-panel p-8 text-center sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">404</p>
        <h1 className="mt-4 font-serif text-4xl text-brown sm:text-5xl">
          Cette page n&apos;existe pas.
        </h1>
        <Link
          href="/"
          className="mt-8 inline-block text-[11px] uppercase tracking-[0.28em] text-brown-soft hover:text-brown"
        >
          Retour à la maison
        </Link>
      </div>
    </div>
  );
}
