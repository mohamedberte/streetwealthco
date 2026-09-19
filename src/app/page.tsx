import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/lib/brand";

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #c9b089 0%, #d8c4a4 38%, #ead9c0 70%, #f3ebdd 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "repeating-linear-gradient(105deg, transparent 0 72px, rgba(36,21,15,0.12) 72px 76px)",
          }}
        />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
          <p className="mb-8 text-[11px] uppercase tracking-[0.42em] text-brown-soft">
            Maison de style · {brand.city}
          </p>
          <Logo size="lg" />
          <p className="mx-auto mt-8 max-w-xl font-serif text-2xl leading-relaxed text-brown-soft sm:text-3xl">
            {brand.tagline}
          </p>
          <div className="mt-12 h-px w-16 bg-gold" />
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/maison"
              className="border border-brown px-8 py-3 text-[11px] uppercase tracking-[0.28em] text-brown hover:bg-brown hover:text-ivory"
            >
              La Maison
            </Link>
            <Link
              href="/boutique"
              className="bg-brown px-8 py-3 text-[11px] uppercase tracking-[0.28em] text-ivory hover:bg-brown-soft"
            >
              Boutique privée
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
            Manifeste
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-brown sm:text-5xl">
            Un streetwear de retenue.
          </h2>
        </div>
        <p className="max-w-lg text-lg leading-8 text-brown-soft">
          StreetWealth Co. ne cherche pas le bruit. La marque compose des
          silhouettes précises, des matières denses, une signature qui se lit
          de près. L&apos;ivoire, le brun, l&apos;or champagne : une palette
          d&apos;atelier, pas de spectacle.
        </p>
      </section>

      <section className="border-y border-border bg-ivory">
        <div className="mx-auto grid max-w-6xl gap-px bg-border md:grid-cols-3">
          {[
            {
              title: "Éditions limitées",
              body: "Chaque pièce est numérotée dans l'esprit, jamais reproduite à l'infini.",
            },
            {
              title: "Accès privé",
              body: "La boutique s'ouvre sur invitation. Le cercle reste volontairement étroit.",
            },
            {
              title: "Coupe d'atelier",
              body: "Des grammages lourds, des finitions nettes, une présence sans ostentation.",
            },
          ].map((item) => (
            <article key={item.title} className="bg-ivory px-8 py-14">
              <h3 className="font-serif text-2xl text-brown">{item.title}</h3>
              <p className="mt-4 leading-7 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="font-serif text-3xl text-brown sm:text-4xl">
          La collection se découvre derrière la porte.
        </p>
        <Link
          href="/acces"
          className="mt-8 inline-block text-[11px] uppercase tracking-[0.28em] text-gold hover:text-brown"
        >
          Demander l&apos;accès
        </Link>
      </section>
    </div>
  );
}
