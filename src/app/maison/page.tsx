import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "La Maison",
};

export default function MaisonPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
        La Maison
      </p>
      <h1 className="mt-4 font-serif text-5xl leading-tight text-brown">
        {brand.tagline}
      </h1>
      <div className="mt-10 space-y-6 text-lg leading-8 text-brown-soft">
        <p>
          StreetWealth Co. est née d&apos;une exigence simple : habiller le
          quotidien avec la même attention qu&apos;une pièce d&apos;archive.
          Le streetwear, ici, n&apos;est pas un costume. C&apos;est une
          écriture.
        </p>
        <p>
          Le triangle discret au cœur du nom n&apos;est pas un ornement. Il
          marque un point d&apos;équilibre — entre la rue et l&apos;atelier,
          entre la matière et la retenue.
        </p>
        <p>
          Les collections restent courtes. Les tissus sont choisis pour leur
          densité. L&apos;or n&apos;apparaît qu&apos;en accent, jamais en
          décor. La boutique, privée, protège ce rythme.
        </p>
      </div>
    </article>
  );
}
