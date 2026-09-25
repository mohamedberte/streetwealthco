import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "La Maison",
};

export default function MaisonPage() {
  return (
    <article className="mx-auto max-w-[78rem] px-4 py-16 sm:px-6 sm:py-20">
      <header data-reveal className="max-w-4xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-brand">
          La Maison
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-brown sm:text-6xl">
          {brand.tagline}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-brown-soft">
          StreetWealth Co. avance avec une idée simple: réunir l'énergie de la
          rue et la tenue d'un vestiaire chic, sans opposer les mondes.
        </p>
      </header>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.04fr_0.96fr]">
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
            densité. L&apos;or intervient en accent discret pour signer le style
            sans l&apos;écraser.
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
            <li>Palette crème, ivoire, brun, avec un or en accent.</li>
            <li>Un message: transcender les frontières sociales par le style.</li>
          </ul>
        </aside>
      </div>
    </article>
  );
}
