import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-[70svh] items-center overflow-hidden px-4 py-20 sm:px-6">
      <div className="absolute inset-0">
        <Image
          src="/visuals/rework-panorama.svg"
          alt=""
          fill
          sizes="100vw"
          className="sw-cinematic-media object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(22,18,15,0.3)_6%,rgba(22,18,15,0.78)_86%)]" />

      <div className="relative mx-auto w-full max-w-2xl">
        <div data-reveal data-drift className="rounded-[1.2rem] border border-ivory/40 bg-ivory/8 p-8 text-center backdrop-blur-[2px] sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-ivory/84">404</p>
          <h1 className="mt-4 font-serif text-4xl text-ivory sm:text-5xl">
            Cette page n&apos;existe pas.
          </h1>
          <Link
            href="/"
            className="mt-8 inline-block text-[11px] uppercase tracking-[0.28em] text-ivory/88 hover:text-white"
          >
            Retour à la maison
          </Link>
        </div>
      </div>
    </div>
  );
}
