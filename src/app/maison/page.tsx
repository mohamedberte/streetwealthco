import type { Metadata } from "next";
import Image from "next/image";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "La Maison",
};

export default function MaisonPage() {
  return (
    <article className="overflow-x-clip">
      <section data-parallax-root className="relative isolate min-h-[62svh] overflow-hidden border-b border-border/70">
        <div className="absolute inset-0">
          <Image
            src="/visuals/rework-chapter-a.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            data-zoom="1.08"
            className="sw-cinematic-media object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(156deg,rgba(22,18,15,0.26)_6%,rgba(22,18,15,0.74)_88%)]" />

        <div className="relative mx-auto flex min-h-[62svh] max-w-[86rem] items-end px-4 pb-12 pt-20 sm:px-6 sm:pb-16">
          <header data-reveal className="max-w-4xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-ivory/84">
              La Maison
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ivory sm:text-6xl">
              {brand.tagline}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/84">
              StreetWealth Co. réunit l'énergie de la rue et la tenue d'un
              vestiaire chic, sans opposer les mondes.
            </p>
          </header>
        </div>
      </section>

      <section className="mx-auto max-w-[86rem] px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr]">
          <div data-reveal data-drift className="sw-panel space-y-6 p-8 text-lg leading-8 text-brown-soft sm:p-10">
            <p>
              StreetWealth Co. est née d&apos;une ambition: casser la barrière
              entre les codes dits "de la rue" et les codes dits "de standing".
              Notre réponse passe par des pièces urbaines raffinées.
            </p>
            <p>
              Le triangle discret au cœur du nom n&apos;est pas un ornement. Il
              marque un point d&apos;équilibre entre spontanéité et précision,
              entre streetwear et allure chic.
            </p>
            <p>
              Les collections restent courtes. Les tissus sont choisis pour leur
              densité. La signature colorielle reste sobre pour garder la
              silhouette au centre.
            </p>
          </div>

          <aside
            data-reveal
            data-reveal-delay="0.12"
            data-drift
            className="sw-panel p-8 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
              Principes fondateurs
            </p>
            <blockquote className="mt-6 border-l border-border pl-5 font-serif text-3xl leading-tight text-brown">
              "Un style fort qui rassemble au lieu de séparer."
            </blockquote>
            <ul className="mt-8 space-y-4 text-sm leading-7 text-brown-soft">
              <li>Streetwear, pulls et polos avec un rendu chic assumé.</li>
              <li>Palette sobre, contrastes posés, accents maîtrisés.</li>
              <li>Un message: transcender les frontières sociales par le style.</li>
            </ul>
          </aside>
        </div>
      </div>
      </section>
    </article>
  );
}
