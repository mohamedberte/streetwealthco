import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/lib/brand";

const pillars = [
  {
    title: "Éditions calibrées",
    body: "Chaque drop reste volontairement resserré. Le rythme est lent, les coupes restent nettes, la présence est durable.",
  },
  {
    title: "Matières denses",
    body: "Molletons lourds, jerseys francs, twills stables. Le vêtement se lit autant au regard qu'au tombé.",
  },
  {
    title: "Signature contenue",
    body: "Le signe existe, sans bruit. L'or intervient comme accent et laisse l'ensemble dans une élégance contrôlée.",
  },
];

const experiences = [
  "Accès sur code privé remis par la maison",
  "Sélection mise à jour en capsules",
  "Réservation locale pour préserver la rareté",
];

const atelierScenes = [
  {
    kicker: "Acte I",
    title: "La ligne se tend.",
    body: "La silhouette s'étire, le volume se place, l'œil capte d'abord la proportion.",
    note: "Structure nette, présence calme.",
  },
  {
    kicker: "Acte II",
    title: "La matière répond.",
    body: "Le molleton dense et le jersey lourd construisent une allure qui garde sa forme.",
    note: "Densité, tenue, précision.",
  },
  {
    kicker: "Acte III",
    title: "Le détail signe.",
    body: "L'accent or n'intervient qu'au point juste, sans bruit, pour fermer la composition.",
    note: "Signature contenue, impact durable.",
  },
];

const runwayTokens = [
  "StreetWealth Co.",
  "Édition Atelier",
  "Paris",
  "Cercle Privé",
  "Volume Mesuré",
  "Matière Dense",
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <section
        data-parallax-root
        className="relative isolate overflow-hidden border-b border-border/80"
      >
        <div
          data-parallax="16"
          className="sw-aura sw-motion-layer absolute inset-0"
          style={{
            background:
              "linear-gradient(130deg, #cfb58c 0%, #dbc6a8 32%, #ebdcc5 68%, #f4ecdf 100%)",
          }}
        />
        <div
          data-parallax="-9"
          className="sw-motion-layer absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "repeating-linear-gradient(112deg, transparent 0 78px, rgba(36,21,15,0.14) 78px 80px)",
          }}
        />
        <div
          data-parallax="12"
          className="sw-motion-layer absolute -left-28 top-20 h-72 w-72 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(169,132,79,0.42) 0%, rgba(169,132,79,0.08) 55%, transparent 70%)",
          }}
        />
        <div
          data-parallax="-14"
          className="sw-motion-layer absolute -right-20 bottom-6 h-80 w-80 rounded-full opacity-25"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(36,21,15,0.26) 0%, rgba(36,21,15,0.06) 58%, transparent 72%)",
          }}
        />
        <div className="relative mx-auto grid max-w-[78rem] gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:pb-28 lg:pt-28">
          <div data-reveal data-reveal-delay="0.04" className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.34em] text-brown-soft">
              Maison de style · {brand.city}
            </p>
            <div className="mt-7">
              <Logo size="lg" />
            </div>
            <h1 className="mt-8 font-serif text-5xl leading-tight text-brown sm:text-6xl">
              Le streetwear dans sa forme la plus tenue.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-brown-soft sm:text-xl">
              {brand.tagline}
            </p>
            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/maison"
                className="border border-brown/85 px-8 py-3 text-[11px] uppercase tracking-[0.3em] text-brown hover:bg-brown hover:text-ivory"
              >
                La Maison
              </Link>
              <Link
                href="/boutique"
                className="bg-brown px-8 py-3 text-[11px] uppercase tracking-[0.3em] text-ivory hover:bg-brown-soft"
              >
                Entrer en boutique
              </Link>
            </div>
          </div>

          <aside
            data-reveal
            data-reveal-delay="0.18"
            data-drift
            className="sw-panel self-end p-9 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
              Rituel privé
            </p>
            <h2 className="mt-4 font-serif text-3xl text-brown">
              Une expérience de maison, jamais de volume.
            </h2>
            <ul
              data-stagger-group
              className="mt-7 space-y-4 text-sm leading-7 text-brown-soft"
            >
              {experiences.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-9 text-[11px] uppercase tracking-[0.24em] text-muted">
              {brand.city} · Studio confidentiel
            </p>
          </aside>
        </div>
      </section>

      <section className="border-b border-border/80 bg-ivory/80">
        <div className="mx-auto max-w-[78rem] px-6 py-10">
          <p
            data-reveal
            className="max-w-4xl font-serif text-3xl leading-snug text-brown sm:text-4xl"
          >
            Le luxe se joue dans les proportions, la retenue et la matière.
            L&apos;effet n&apos;est jamais immédiat, il s&apos;installe.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80 bg-ivory/70 py-5 overflow-hidden">
        <div className="sw-runway-wrap">
          <div data-runway-track className="sw-runway-track">
            {runwayTokens.concat(runwayTokens).map((token, index) => (
              <span key={`${token}-${index}`} className="sw-runway-token">
                {token}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[78rem] px-6 py-24">
        <div data-reveal className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
            Motion Atelier
          </p>
          <h2 className="mt-4 font-serif text-5xl leading-tight text-brown sm:text-6xl">
            Une séquence pensée comme un passage de runway.
          </h2>
        </div>

        <div data-scene-pin data-scene-distance="240" className="sw-scene-stage mt-12">
          <div data-scene-focus className="sw-scene-focus sw-motion-layer">
            <div className="sw-scene-grid" />
            <div className="sw-scene-aura" />
            <p className="sw-scene-mark">StreetWealth Co. · Paris</p>
          </div>

          <div className="sw-scene-copy-stack">
            {atelierScenes.map((scene) => (
              <article key={scene.title} data-scene-copy className="sw-panel sw-scene-copy">
                <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
                  {scene.kicker}
                </p>
                <h3 className="mt-3 font-serif text-3xl leading-tight text-brown sm:text-4xl">
                  {scene.title}
                </h3>
                <p className="mt-4 leading-7 text-brown-soft">{scene.body}</p>
                <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-muted">
                  {scene.note}
                </p>
              </article>
            ))}
          </div>

          <div className="sw-scene-steps" aria-hidden>
            {atelierScenes.map((scene) => (
              <span
                key={scene.kicker}
                data-scene-step
                className="sw-scene-step"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[78rem] px-6 py-24">
        <div className="grid gap-px bg-border/70 md:grid-cols-3">
          {pillars.map((item, index) => (
            <article
              key={item.title}
              data-reveal
              data-reveal-delay={(index * 0.09).toFixed(2)}
              data-drift
              className="sw-grain bg-ivory/85 px-8 py-12"
            >
              <h3 className="relative z-10 font-serif text-3xl text-brown">
                {item.title}
              </h3>
              <p className="relative z-10 mt-5 leading-7 text-brown-soft">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/80 bg-ivory/65">
        <div className="mx-auto grid max-w-[78rem] gap-10 px-6 py-24 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div data-reveal>
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
              Manifeste
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-5xl leading-tight text-brown">
              Une coupe d&apos;atelier pour la rue.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-brown-soft">
              StreetWealth Co. compose une silhouette calme, structurée, et
              durable. Le vêtement n&apos;appelle pas l&apos;attention: il la
              garde.
            </p>
            <Link
              href="/maison"
              className="mt-8 inline-block text-[11px] uppercase tracking-[0.28em] text-brown-soft hover:text-brown"
            >
              Lire la Maison
            </Link>
          </div>

          <div
            data-reveal
            data-reveal-delay="0.14"
            data-drift
            className="sw-panel p-8 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
              Séquence d&apos;accès
            </p>
            <ol data-stagger-group className="mt-6 space-y-6">
              <li className="border-l border-border pl-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                  01
                </p>
                <p className="mt-2 text-brown-soft">
                  Demande d&apos;entrée via la porte privée.
                </p>
              </li>
              <li className="border-l border-border pl-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                  02
                </p>
                <p className="mt-2 text-brown-soft">
                  Activation du code et découverte des capsules.
                </p>
              </li>
              <li className="border-l border-border pl-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                  03
                </p>
                <p className="mt-2 text-brown-soft">
                  Réservation des pièces depuis votre sélection locale.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[78rem] px-6 py-24">
        <div data-reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-xl font-serif text-4xl leading-tight text-brown sm:text-5xl">
            Les collections suivent le mouvement, jamais la tendance.
          </h2>
          <Link
            href="/collections"
            className="text-[11px] uppercase tracking-[0.28em] text-brown-soft hover:text-brown"
          >
            Voir l&apos;aperçu public
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Link
            href="/collections"
            data-reveal
            data-drift
            className="group sw-panel block p-8 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
              Collections
            </p>
            <h3 className="mt-4 font-serif text-3xl text-brown">
              Silhouettes d&apos;atelier
            </h3>
            <p className="mt-4 max-w-sm leading-7 text-brown-soft">
              Une lecture publique des coupes, textures et volumes de la maison.
            </p>
            <p className="mt-8 text-[11px] uppercase tracking-[0.24em] text-gold group-hover:text-brown">
              Explorer
            </p>
          </Link>

          <Link
            href="/acces"
            data-reveal
            data-reveal-delay="0.12"
            data-drift
            className="group sw-panel block p-8 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
              Boutique privée
            </p>
            <h3 className="mt-4 font-serif text-3xl text-brown">
              Entrée sur code
            </h3>
            <p className="mt-4 max-w-sm leading-7 text-brown-soft">
              L&apos;accès ouvre un espace réservé avec les pièces actives du
              moment.
            </p>
            <p className="mt-8 text-[11px] uppercase tracking-[0.24em] text-gold group-hover:text-brown">
              Demander l&apos;accès
            </p>
          </Link>
        </div>
      </section>

      <section className="border-t border-border/80 bg-ivory/70">
        <div className="mx-auto max-w-[78rem] px-6 py-20 text-center">
          <p data-reveal className="font-serif text-3xl text-brown sm:text-4xl">
            Une allure qui dure plus qu&apos;une saison.
          </p>
          <Link
            data-reveal
            data-reveal-delay="0.12"
            href="/contact"
            className="mt-8 inline-block text-[11px] uppercase tracking-[0.3em] text-brown-soft hover:text-brown"
          >
            Contacter l&apos;atelier
          </Link>
        </div>
      </section>
    </div>
  );
}
