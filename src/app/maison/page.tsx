import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "La Maison",
};

export default function MaisonPage() {
  return (
    <article className="mx-auto max-w-[78rem] px-6 py-20">
      <header data-reveal className="max-w-4xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
          La Maison
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-brown sm:text-6xl">
          {brand.tagline}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-brown-soft">
          StreetWealth Co. avance dans une ligne nette: moins de volume, plus
          de tenue. La silhouette reste urbaine, l&apos;approche reste
          couture.
        </p>
      </header>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.04fr_0.96fr]">
        <div data-reveal data-drift className="sw-panel space-y-6 p-8 text-lg leading-8 text-brown-soft sm:p-10">
          <p>
            StreetWealth Co. est née d&apos;une exigence simple: habiller le
            quotidien avec la même attention qu&apos;une pièce d&apos;archive.
            Le streetwear, ici, n&apos;est pas un costume. C&apos;est une
            écriture.
          </p>
          <p>
            Le triangle discret au cœur du nom n&apos;est pas un ornement. Il
            marque un point d&apos;équilibre entre la rue et l&apos;atelier,
            entre l&apos;instinct et la précision.
          </p>
          <p>
            Les collections restent courtes. Les tissus sont choisis pour leur
            densité. L&apos;or n&apos;intervient qu&apos;en accent, jamais en
            décor.
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
            "Une allure distincte se reconnaît sans jamais se forcer."
          </blockquote>
          <ul className="mt-8 space-y-4 text-sm leading-7 text-brown-soft">
            <li>Capsules réduites et renouvelées avec mesure.</li>
            <li>Palette crème, ivoire, brun, avec un or strictement accent.</li>
            <li>Finitions propres, coupe précise, présence silencieuse.</li>
          </ul>
        </aside>
      </div>
    </article>
  );
}
