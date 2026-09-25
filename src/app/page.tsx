import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/lib/brand";

const pillars = [
  {
    title: "Rue x Raffinement",
    body: "StreetWealth Co. mélange l'attitude urbaine et des finitions premium pour créer une élégance nouvelle, sans costume social.",
  },
  {
    title: "Style sans barrières",
    body: "Notre vision réunit les mondes. Le style n'appartient ni à une rue, ni à une élite: il rassemble, il élève, il relie.",
  },
  {
    title: "Streetwear chic",
    body: "Hoodies, tees, pulls et polos: des pièces urbaines avec une tenue chic, pensées pour durer et se porter partout.",
  },
];

const experiences = [
  "Capsules limitées et rythmes mesurés",
  "Streetwear + pièces chic comme pulls et polos",
  "Un style qui rapproche les mondes sociaux",
];

const bridgeScenes = [
  {
    kicker: "Acte I",
    title: "La rue donne l'impulsion.",
    body: "L'énergie urbaine reste brute, directe, vivante. C'est la base de notre langage.",
    note: "Énergie, mouvement, authenticité.",
  },
  {
    kicker: "Acte II",
    title: "Le chic pose le cadre.",
    body: "Les coupes se précisent, les matières prennent de la tenue, la silhouette devient plus posée.",
    note: "Clarté, précision, équilibre.",
  },
  {
    kicker: "Acte III",
    title: "Les frontières tombent.",
    body: "Au final, les codes se rejoignent: un style distinctif qui parle à tous sans opposer les mondes.",
    note: "Union des cultures, signature StreetWealth.",
  },
];

const runwayTokens = [
  "StreetWealth Co.",
  "Streetwear Chic",
  "Paris",
  "Pulls & Polos",
  "Rue + Élégance",
  "Sans Frontières",
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
              "linear-gradient(130deg, #cdbb9f 0%, #ddd0bb 32%, #d8ded3 68%, #edf0ea 100%)",
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
              "radial-gradient(circle at 50% 50%, rgba(53,90,71,0.38) 0%, rgba(53,90,71,0.08) 55%, transparent 70%)",
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
        <div className="relative mx-auto grid max-w-[78rem] gap-10 px-4 pb-16 pt-14 sm:gap-14 sm:px-6 sm:pb-24 sm:pt-18 lg:grid-cols-[1.08fr_0.92fr] lg:pb-28 lg:pt-24">
          <div data-reveal data-reveal-delay="0.04" className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.34em] text-brown-soft">
              Streetwear raffiné · {brand.city}
            </p>
            <div className="mt-7">
              <Logo size="lg" />
            </div>
            <h1 className="mt-7 font-serif text-4xl leading-tight text-brown sm:text-5xl lg:text-6xl">
              La rue rencontre
              <br />
              l&apos;élégance.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-brown-soft sm:text-xl">
              {brand.tagline}
            </p>
            <p className="mt-3 max-w-xl text-base leading-7 text-brown-soft/90">
              Notre ambition: unir les codes street et premium pour créer un
              style urbain chic qui transcende les frontières sociales.
            </p>
            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/maison"
                className="w-full border border-brand/75 px-8 py-3 text-center text-[11px] uppercase tracking-[0.3em] text-brand hover:bg-brand hover:text-ivory sm:w-auto"
              >
                La Maison
              </Link>
              <Link
                href="/boutique"
                className="w-full bg-brand px-8 py-3 text-center text-[11px] uppercase tracking-[0.3em] text-ivory hover:bg-brand/88 sm:w-auto"
              >
                Entrer en boutique
              </Link>
            </div>
          </div>

          <aside
            data-reveal
            data-reveal-delay="0.18"
            data-drift
            className="sw-panel self-end p-7 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
              Vision StreetWealth
            </p>
            <h2 className="mt-4 font-serif text-2xl text-brown sm:text-3xl">
              Briser les frontières par le style.
            </h2>
            <ul
              data-stagger-group
              className="mt-7 space-y-4 text-sm leading-7 text-brown-soft"
            >
              {experiences.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-9 text-[11px] uppercase tracking-[0.24em] text-muted">
              {brand.city} · Collectif créatif
            </p>
          </aside>
        </div>
      </section>

      <section className="border-b border-border/80 bg-ivory/80">
        <div className="mx-auto max-w-[78rem] px-4 py-10 sm:px-6">
          <p
            data-reveal
            className="max-w-4xl font-serif text-2xl leading-snug text-brown sm:text-4xl"
          >
            La rue et le chic ne s&apos;opposent pas. Quand ils dialoguent,
            ils créent une allure nouvelle, inclusive et distinctive.
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

      <section className="mx-auto max-w-[78rem] px-4 py-16 sm:px-6 sm:py-24">
        <div data-reveal className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
            Récit StreetWealth
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-brown sm:text-6xl">
            Une séquence où les mondes se rencontrent.
          </h2>
        </div>

        <div
          data-scene-pin
          data-scene-distance="240"
          className="sw-scene-stage mt-10 sm:mt-12"
        >
          <div data-scene-focus className="sw-scene-focus sw-motion-layer">
            <div className="sw-scene-grid" />
            <div className="sw-scene-aura" />
            <p className="sw-scene-mark">StreetWealth Co. · Sans frontières</p>
          </div>

          <div className="sw-scene-copy-stack">
            {bridgeScenes.map((scene) => (
              <article key={scene.title} data-scene-copy className="sw-panel sw-scene-copy">
                <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
                  {scene.kicker}
                </p>
                <h3 className="mt-3 font-serif text-2xl leading-tight text-brown sm:text-4xl">
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
            {bridgeScenes.map((scene) => (
              <span
                key={scene.kicker}
                data-scene-step
                className="sw-scene-step"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[78rem] px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-px bg-border/70 md:grid-cols-3">
          {pillars.map((item, index) => (
            <article
              key={item.title}
              data-reveal
              data-reveal-delay={(index * 0.09).toFixed(2)}
              data-drift
              className="sw-grain bg-ivory/85 px-6 py-10 sm:px-8 sm:py-12"
            >
              <h3 className="relative z-10 font-serif text-2xl text-brown sm:text-3xl">
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
        <div className="mx-auto grid max-w-[78rem] gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div data-reveal>
            <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
              Manifeste
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight text-brown sm:text-5xl">
              Réconcilier la rue et le chic.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-brown-soft">
              StreetWealth Co. défend une mode urbaine raffinée, capable de
              parler à toutes les trajectoires. Un style posé, fort et ouvert.
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
            className="sw-panel p-7 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
              Notre démarche
            </p>
            <ol data-stagger-group className="mt-6 space-y-6">
              <li className="border-l border-border pl-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-brand">
                  01
                </p>
                <p className="mt-2 text-brown-soft">
                  S'inspirer de la rue et de sa liberté d'expression.
                </p>
              </li>
              <li className="border-l border-border pl-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-brand">
                  02
                </p>
                <p className="mt-2 text-brown-soft">
                  Ajouter la précision d'une allure chic et premium.
                </p>
              </li>
              <li className="border-l border-border pl-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-brand">
                  03
                </p>
                <p className="mt-2 text-brown-soft">
                  Rassembler sans hiérarchie, avec un style distinctif.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[78rem] px-4 py-16 sm:px-6 sm:py-24">
        <div data-reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-xl font-serif text-3xl leading-tight text-brown sm:text-5xl">
            Streetwear, pulls, polos: le vestiaire urbain version chic.
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
            className="group sw-panel block p-7 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
              Collections
            </p>
            <h3 className="mt-4 font-serif text-2xl text-brown sm:text-3xl">
              Vestiaire urbain raffiné
            </h3>
            <p className="mt-4 max-w-sm leading-7 text-brown-soft">
              Explorez les pièces qui fusionnent l'énergie streetwear et une
              allure chic assumée.
            </p>
            <p className="mt-8 text-[11px] uppercase tracking-[0.24em] text-brand group-hover:text-brown">
              Explorer
            </p>
          </Link>

          <Link
            href="/acces"
            data-reveal
            data-reveal-delay="0.12"
            data-drift
            className="group sw-panel block p-7 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
              Boutique privée
            </p>
            <h3 className="mt-4 font-serif text-2xl text-brown sm:text-3xl">
              Capsules limitées
            </h3>
            <p className="mt-4 max-w-sm leading-7 text-brown-soft">
              Accédez aux drops du moment et composez votre sélection sur cet
              appareil.
            </p>
            <p className="mt-8 text-[11px] uppercase tracking-[0.24em] text-brand group-hover:text-brown">
              Demander l&apos;accès
            </p>
          </Link>
        </div>
      </section>

      <section className="border-t border-border/80 bg-ivory/70">
        <div className="mx-auto max-w-[78rem] px-4 py-16 text-center sm:px-6 sm:py-20">
          <p data-reveal className="font-serif text-3xl text-brown sm:text-4xl">
            Un style qui rassemble, au-delà des frontières.
          </p>
          <Link
            data-reveal
            data-reveal-delay="0.12"
            href="/contact"
            className="mt-8 inline-block text-[11px] uppercase tracking-[0.3em] text-brown-soft hover:text-brown"
          >
            Parler avec nous
          </Link>
        </div>
      </section>
    </div>
  );
}
