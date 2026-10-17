import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex h-svh flex-col items-center justify-center gap-8 bg-brown px-6 text-center text-ivory">
      <p className="text-[11px] uppercase tracking-[0.34em] text-ivory/60">404</p>
      <h1 className="font-serif text-4xl sm:text-6xl">Rien à exposer ici.</h1>
      <Link href="/" className="tx-btn">
        Retour à l&apos;exposition
      </Link>
    </main>
  );
}
