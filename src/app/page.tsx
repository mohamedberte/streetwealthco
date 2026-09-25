import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/lib/brand";

const immersivePillars = [
  {
    kicker: "Axe I",
    title: "Rue x Raffinement",
    body: "StreetWealth Co. mélange l'attitude urbaine et des finitions premium pour créer une élégance nouvelle, sans costume social.",
    image: "/visuals/story-rue-raffinement.svg",
  },
  {
    kicker: "Axe II",
    title: "Style sans barrières",
    body: "Notre vision réunit les mondes. Le style n'appartient ni à une rue, ni à une élite: il rassemble, il élève, il relie.",
    image: "/visuals/story-frontieres.svg",
  },
  {
    kicker: "Axe III",
    title: "Streetwear chic",
    body: "Hoodies, tees, pulls et polos: des pièces urbaines avec une tenue chic, pensées pour durer et se porter partout.",
    image: "/visuals/story-silhouette.svg",
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

const accessCards = [
  {
    href: "/collections",
    kicker: "Collections",
    title: "Vestiaire urbain raffiné",
    body: "Explorez les pièces qui fusionnent l'énergie streetwear et une allure chic assumée.",
    cta: "Explorer",
    image: "/visuals/story-frontieres.svg",
  },
  {
    href: "/acces",
    kicker: "Boutique privée",
    title: "Capsules limitées",
    body: "Accédez aux drops du moment et composez votre sélection sur cet appareil.",
    cta: "Demander l'accès",
    image: "/visuals/story-silhouette.svg",
  },
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <section
        data-parallax-root
        className="relative isolate overflow-hidden border-b border-border/80"
      >
        <div className="absolute inset-0">
          <Image
            src="/visuals/hero-cinematic.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            data-zoom="1.14"
            className="sw-cinematic-media object-cover"
          />
        </div>
        <div
          data-parallax="12"
          className="sw-motion-layer absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(250,248,243,0.5),transparent_50%)]"
        />
        <div
          data-parallax="-8"
          className="sw-motion-layer absolute inset-0 bg-[linear-gradient(124deg,rgba(36,21,15,0.34)_0%,rgba(36,21,15,0.16)_44%,rgba(36,21,15,0.5)_100%)]"
        />
        <div
          data-parallax="18"
          className="sw-motion-layer absolute -left-20 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(53,90,71,0.5),rgba(53,90,71,0.08)_58%,transparent_72%)] opacity-60"
        />
        <div
          data-parallax="-14"
          className="sw-motion-layer absolute -right-28 bottom-10 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(53,90,71,0.42),rgba(53,90,71,0.08)_62%,transparent_75%)] opacity-70"
        />
        <div className="sw-light-sweep pointer-events-none absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-cream/88 via-cream/56 to-transparent" />

        <div className="relative mx-auto grid max-w-[78rem] gap-9 px-4 pb-16 pt-14 sm:gap-14 sm:px-6 sm:pb-24 sm:pt-18 lg:grid-cols-[1.04fr_0.96fr] lg:pb-28 lg:pt-24">
          <div data-reveal data-reveal-delay="0.04" className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.34em] text-ivory/88">
              Streetwear raffiné · {brand.city}
            </p>
            <div className="mt-7">
              <Logo size="lg" className="text-ivory" />
            </div>
            <h1 className="mt-7 font-serif text-4xl leading-tight text-ivory sm:text-5xl lg:text-6xl">
              La rue rencontre
              <br />
              l&apos;élégance.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-ivory/90 sm:text-xl">
              {brand.tagline}
            </p>
            <p className="mt-3 max-w-xl text-base leading-7 text-ivory/80">
              Notre ambition: unir les codes street et premium pour créer un
              style urbain chic qui transcende les frontières sociales.
            </p>
            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/maison"
                className="w-full border border-ivory/65 bg-ivory/12 px-8 py-3 text-center text-[11px] uppercase tracking-[0.3em] text-ivory backdrop-blur-[2px] hover:bg-ivory hover:text-brand sm:w-auto"
              >
                La Maison
              </Link>
              <Link
                href="/boutique"
                className="w-full bg-brand px-8 py-3 text-center text-[11px] uppercase tracking-[0.3em] text-ivory hover:bg-brand/86 sm:w-auto"
              >
                Entrer en boutique
              </Link>
            </div>

            <div
              data-reveal
              data-reveal-delay="0.16"
              data-drift
              className="relative mt-10 min-h-[16rem] overflow-hidden rounded-[1.3rem] border border-ivory/45 lg:hidden"
            >
              <Image
                src="/visuals/hero-mobile-cinematic.svg"
                alt="Perspective StreetWealth"
                fill
                sizes="(max-width: 1024px) 92vw, 1px"
                data-zoom="1.1"
                className="sw-cinematic-media object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(166deg,rgba(36,21,15,0.2)_0%,rgba(36,21,15,0.58)_95%)]" />
              <p className="relative px-6 pb-6 pt-28 text-sm uppercase tracking-[0.24em] text-ivory/90">
                Silhouette urbaine. Mouvement précis.
              </p>
            </div>
          </div>

          <aside
            data-reveal
            data-reveal-delay="0.18"
            data-drift
            className="sw-glass-panel self-end p-7 sm:p-10"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-ivory/75">
              Vision StreetWealth
            </p>
            <h2 className="mt-4 font-serif text-2xl text-ivory sm:text-3xl">
              Briser les frontières par le style.
            </h2>
            <ul
              data-stagger-group
              className="mt-7 space-y-4 text-sm leading-7 text-ivory/86"
            >
              {experiences.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-ivory/90" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-9 text-[11px] uppercase tracking-[0.24em] text-ivory/66">
              {brand.city} · Collectif créatif
            </p>
          </aside>
        </div>
      </section>

      <section data-parallax-root className="relative isolate overflow-hidden border-b border-border/70">
        <div data-parallax="9" className="absolute inset-0">
          <Image
            src="/visuals/bridge-panorama.svg"
            alt=""
            fill
            sizes="100vw"
            data-zoom="1.08"
            className="sw-cinematic-media object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(243,235,221,0.4)_0%,rgba(243,235,221,0.8)_48%,rgba(243,235,221,0.95)_100%)]" />
        <div className="relative mx-auto max-w-[78rem] px-4 py-14 sm:px-6 sm:py-20">
          <p
            data-reveal
            className="max-w-4xl font-serif text-3xl leading-[1.16] text-brown sm:text-5xl"
          >
            La rue et le chic ne s&apos;opposent pas. Quand ils dialoguent,
            ils créent une allure nouvelle, inclusive et distinctive.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80 bg-ivory/60 py-5 overflow-hidden">
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

      <section className="mx-auto max-w-[86rem] px-0 py-12 sm:px-6 sm:py-20">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {immersivePillars.map((item, index) => (
            <article
              key={item.title}
              data-reveal
              data-reveal-delay={(index * 0.09).toFixed(2)}
              data-drift
              className="group relative isolate min-h-[22rem] overflow-hidden border-y border-border/70 sm:min-h-[29rem] sm:rounded-[1.3rem] sm:border"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1200px) 34vw, 30vw"
                data-zoom="1.08"
                className="sw-cinematic-media object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(176deg,rgba(36,21,15,0.12)_8%,rgba(36,21,15,0.74)_84%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(250,248,243,0.2),transparent_54%)]" />

              <div className="relative z-10 flex h-full flex-col justify-end px-6 py-8 sm:px-8 sm:py-10">
                <p className="text-[11px] uppercase tracking-[0.26em] text-ivory/84">
                  {item.kicker}
                </p>
                <h3 className="mt-3 font-serif text-3xl leading-tight text-ivory sm:text-[2rem]">
                  {item.title}
                </h3>
                <p className="mt-4 leading-7 text-ivory/86">{item.body}</p>
              </div>
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
          {accessCards.map((card, index) => (
            <Link
              key={card.href}
              href={card.href}
              data-reveal
              data-reveal-delay={(index * 0.1).toFixed(2)}
              data-drift
              className="group relative isolate min-h-[19rem] overflow-hidden rounded-[1.25rem] border border-border/70"
            >
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes="(max-width: 767px) 100vw, 48vw"
                data-zoom="1.1"
                className="sw-cinematic-media object-cover transition-transform duration-[1300ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(36,21,15,0.16)_4%,rgba(36,21,15,0.76)_88%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(250,248,243,0.24),transparent_48%)]" />

              <div className="relative z-10 flex h-full flex-col justify-end p-7 sm:p-10">
                <p className="text-[11px] uppercase tracking-[0.24em] text-ivory/80">
                  {card.kicker}
                </p>
                <h3 className="mt-4 font-serif text-2xl text-ivory sm:text-3xl">
                  {card.title}
                </h3>
                <p className="mt-4 max-w-sm leading-7 text-ivory/88">
                  {card.body}
                </p>
                <p className="mt-8 text-[11px] uppercase tracking-[0.24em] text-ivory/94 group-hover:text-white">
                  {card.cta}
                </p>
              </div>
            </Link>
          ))}
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
