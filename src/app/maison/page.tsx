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
        <p>{brand.mission}</p>
        <p>{brand.offer}</p>
      </div>

      <section className="mt-16 border-t border-border pt-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
          Vision
        </p>
        <h2 className="mt-4 font-serif text-3xl text-brown">
          {brand.visionLead}
        </h2>
        <p className="mt-6 text-lg leading-8 text-brown-soft">{brand.vision}</p>
      </section>

      <section className="mt-16 border-t border-border pt-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
          Valeurs
        </p>
        <ul className="mt-10 space-y-10">
          {brand.values.map((item) => (
            <li key={item.title}>
              <h3 className="font-serif text-2xl text-brown">{item.title}</h3>
              <p className="mt-3 leading-7 text-brown-soft">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
