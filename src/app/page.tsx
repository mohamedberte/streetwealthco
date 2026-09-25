import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/lib/brand";

const heroSignals = [
  "Capsules limitées",
  "Streetwear chic",
  "Sans frontières",
];

const campaignChapters = [
  {
    kicker: "Acte I",
    title: "Rue x Raffinement",
    body: "La rue donne l'impulsion. Le chic apporte la tenue. StreetWealth Co. compose une allure urbaine plus précise, plus calme, plus assumée.",
    note: "Énergie urbaine, coupe nette, présence durable.",
    image: "/visuals/story-rue-raffinement.svg",
  },
  {
    kicker: "Acte II",
    title: "Style sans barrières",
    body: "Ni uniforme social, ni posture fermée. Notre silhouette relie les mondes et laisse à chacun une place lisible dans le même mouvement.",
    note: "Ouverture, équilibre, trajectoires partagées.",
    image: "/visuals/story-frontieres.svg",
  },
  {
    kicker: "Acte III",
    title: "Streetwear chic",
    body: "Hoodies, tees, pulls, polos: un vestiaire urbain chic pensé pour durer, circuler et rester juste du matin à la nuit.",
    note: "Confort net, matières posées, ligne continue.",
    image: "/visuals/story-silhouette.svg",
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

const gatewayPanels = [
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
        className="relative isolate min-h-[92svh] overflow-hidden border-b border-border/80"
      >
        <div data-parallax="10" className="absolute inset-0 hidden sm:block">
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
          data-parallax="7"
          className="absolute inset-0 sm:hidden"
        >
          <Image
            src="/visuals/hero-mobile-cinematic.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            data-zoom="1.12"
            className="sw-cinematic-media object-cover"
          />
        </div>
        <div
          data-parallax="12"
          className="sw-motion-layer absolute inset-0 bg-[radial-gradient(circle_at_14%_22%,rgba(250,248,243,0.34),transparent_54%)]"
        />
        <div
          data-parallax="-8"
          className="sw-motion-layer absolute inset-0 bg-[linear-gradient(128deg,rgba(36,21,15,0.48)_0%,rgba(36,21,15,0.28)_44%,rgba(36,21,15,0.62)_100%)]"
        />
        <div
          data-parallax="14"
          className="sw-motion-layer absolute inset-0 bg-[radial-gradient(circle_at_78%_86%,rgba(53,90,71,0.38),transparent_40%)]"
        />
        <div className="sw-light-sweep pointer-events-none absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-cream via-cream/74 to-transparent" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-[84rem] items-end px-4 pb-14 pt-24 sm:px-6 sm:pb-20 lg:pb-24">
          <div data-reveal data-reveal-delay="0.04" className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.34em] text-ivory/88">
              Streetwear raffiné · {brand.city}
            </p>
            <div className="mt-7">
              <Logo size="lg" className="text-ivory" />
            </div>
            <h1 className="mt-7 font-serif text-4xl leading-[1.02] text-ivory sm:text-6xl lg:text-7xl">
              La rue rencontre
              <br />
              l&apos;élégance.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-ivory/90 sm:text-xl">
              {brand.tagline}
            </p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ivory/80">
              Notre ambition: unir les codes street et premium pour créer un
              style urbain chic qui transcende les frontières sociales.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
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

            <ul
              data-stagger-group
              className="mt-9 grid gap-3 text-[10px] uppercase tracking-[0.24em] text-ivory/84 sm:grid-cols-3 sm:text-[11px]"
            >
              {heroSignals.map((signal) => (
                <li key={signal} className="border-t border-ivory/34 pt-3">
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section data-parallax-root className="relative isolate overflow-hidden border-y border-border/70">
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
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(243,235,221,0.46)_0%,rgba(243,235,221,0.82)_52%,rgba(243,235,221,0.96)_100%)]" />
        <div className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 sm:py-24">
          <p
            data-reveal
            className="max-w-5xl font-serif text-3xl leading-[1.14] text-brown sm:text-5xl lg:text-6xl"
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

      <section className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 sm:py-24">
        <div data-reveal className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
            Récit de campagne
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-brown sm:text-6xl">
            Des images larges, un rythme plus éditorial.
          </h2>
        </div>

        <div className="mt-10 space-y-8 sm:mt-14 sm:space-y-10">
          {campaignChapters.map((chapter, index) => (
            <article
              key={chapter.title}
              className="grid gap-6 lg:grid-cols-[1.14fr_0.86fr] lg:items-end"
            >
              <div
                data-reveal
                data-drift
                className={`group relative isolate min-h-[56svh] overflow-hidden border-y border-border/70 sm:rounded-[1.3rem] sm:border ${
                  index % 2 === 1 ? "lg:order-2" : ""
                }`}
              >
                <Image
                  src={chapter.image}
                  alt={chapter.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 62vw"
                  data-zoom="1.1"
                  className="sw-cinematic-media object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(178deg,rgba(36,21,15,0.08)_8%,rgba(36,21,15,0.74)_100%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-ivory/84">
                    {chapter.kicker}
                  </p>
                  <h3 className="mt-3 font-serif text-3xl leading-tight text-ivory sm:text-4xl">
                    {chapter.title}
                  </h3>
                </div>
              </div>

              <div
                data-reveal
                data-reveal-delay="0.1"
                className={`space-y-4 px-1 sm:px-3 ${index % 2 === 1 ? "lg:order-1" : ""}`}
              >
                <p className="text-lg leading-8 text-brown-soft">{chapter.body}</p>
                <p className="text-[11px] uppercase tracking-[0.24em] text-brand">
                  {chapter.note}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/80 bg-ivory/65">
        <div className="mx-auto grid max-w-[84rem] gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1fr] lg:items-center">
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

      <section className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 sm:py-24">
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
          {gatewayPanels.map((card, index) => (
            <Link
              key={card.href}
              href={card.href}
              data-reveal
              data-reveal-delay={(index * 0.1).toFixed(2)}
              data-drift
              className="group relative isolate min-h-[46svh] overflow-hidden border-y border-border/70 sm:rounded-[1.25rem] sm:border"
            >
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes="(max-width: 767px) 100vw, 48vw"
                data-zoom="1.1"
                className="sw-cinematic-media object-cover transition-transform duration-[1300ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(168deg,rgba(36,21,15,0.2)_4%,rgba(36,21,15,0.8)_88%)]" />
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
