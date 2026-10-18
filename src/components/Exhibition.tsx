"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CartButton } from "@/components/CartDrawer";
import { useCart } from "@/components/CartProvider";
import { Garment } from "@/components/Garment";
import { InfoPanel } from "@/components/InfoPanel";
import { Logo } from "@/components/Logo";
import { Lookbook } from "@/components/Lookbook";
import { Reserve } from "@/components/Reserve";
import { ShareButton } from "@/components/ShareButton";
import { editionTotal, formatPrice, isLimited, type Product } from "@/lib/products";

export type Availability = Record<string, Record<string, number>>;

const LOCK_MS = 1250;

const pad = (n: number) => String(n + 1).padStart(2, "0");

/** Taille du mot géant : ajustée à sa longueur pour tenir dans l'écran. */
const wordSize = (word: string) =>
  `min(${Math.min(22, 148 / word.length).toFixed(1)}vw, 36svh)`;

export function Exhibition({
  products,
  availability,
  initialSlug,
  pages,
  tagline,
  logoUrl,
}: {
  /** Catalogue actif (non vide), dans l'ordre d'affichage. */
  products: Product[];
  availability: Availability;
  initialSlug?: string;
  pages: { slug: string; title: string }[];
  tagline: string;
  logoUrl?: string | null;
}) {
  const COUNT = products.length;
  const initialIndex = Math.max(
    0,
    products.findIndex((product) => product.slug === initialSlug),
  );
  const { open: cartOpen } = useCart();
  const rootRef = useRef<HTMLElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const indexRef = useRef(initialIndex);
  const lockUntil = useRef(0);
  /** Transition en cours : interrompue si un nouveau geste arrive avant sa fin. */
  const transition = useRef<gsap.core.Timeline | null>(null);
  const cartOpenRef = useRef(false);
  const infoOpenRef = useRef(false);
  const lookbookOpenRef = useRef(false);
  /** Vrai si le dernier geste sur la pièce était un glisser (pas un clic). */
  const draggedRef = useRef(false);
  const [index, setIndex] = useState(initialIndex);
  const [hinted, setHinted] = useState(true);
  const [avail, setAvail] = useState<Availability>(availability);
  const [infoOpen, setInfoOpen] = useState(false);
  const [lookbookOpen, setLookbookOpen] = useState(false);

  useEffect(() => {
    cartOpenRef.current = cartOpen;
  }, [cartOpen]);

  useEffect(() => {
    infoOpenRef.current = infoOpen;
  }, [infoOpen]);

  useEffect(() => {
    lookbookOpenRef.current = lookbookOpen;
  }, [lookbookOpen]);

  /* Disponibilités à jour : au retour sur l'onglet et régulièrement */
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/availability", { cache: "no-store" });
        if (response.ok && active) setAvail((await response.json()) as Availability);
      } catch {
        /* hors ligne : on garde les dernières valeurs connues */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [cartOpen]);

  /** Renvoie false si la transition n'a pas démarré (verrou, même pièce). */
  const go = useCallback((to: number, dir?: 1 | -1): boolean => {
    const root = rootRef.current;
    const now = performance.now();
    const from = indexRef.current;
    const target = ((to % COUNT) + COUNT) % COUNT;
    const out = slideRefs.current[from];
    const inn = slideRefs.current[target];
    if (!root || !out || !inn || target === from || now < lockUntil.current) return false;

    const d = dir ?? (target > from ? 1 : -1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vw = window.innerWidth;
    const tone = products[target].tone;
    const q = (el: HTMLElement, selector: string) =>
      el.querySelectorAll<HTMLElement>(selector);
    const from_ = d > 0 ? "start" : "end";

    lockUntil.current = now + LOCK_MS;
    indexRef.current = target;
    setIndex(target);
    setHinted(false);
    window.history.replaceState(null, "", `/?piece=${products[target].slug}`);

    // L'animation précédente dure plus longtemps que le verrou : sans interruption, ses derniers
    // mouvements (et sa fin différée) écraseraient ceux-ci et masqueraient la pièce qui revient.
    transition.current?.kill();
    const parts = "[data-char],[data-art],[data-ring],[data-reveal]";
    gsap.killTweensOf(q(out, parts));
    gsap.killTweensOf(q(inn, parts));
    slideRefs.current.forEach((slide, i) => {
      if (slide && i !== from && i !== target) gsap.set(slide, { autoAlpha: 0 });
    });

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        if (indexRef.current !== from) gsap.set(out, { autoAlpha: 0 });
      },
    });
    transition.current = tl;
    if (reduce) tl.timeScale(12);

    tl.to(root, {
      backgroundColor: tone.bg,
      color: tone.ink,
      duration: 1.1,
      ease: "power2.inOut",
    })
      .to(
        q(out, "[data-char]"),
        {
          yPercent: -115,
          stagger: { each: 0.025, from: from_ },
          duration: 0.7,
          ease: "power3.in",
        },
        0,
      )
      .to(
        q(out, "[data-art]"),
        {
          x: -d * vw * 0.3,
          rotation: -d * 10,
          scale: 0.92,
          autoAlpha: 0,
          duration: 0.9,
        },
        0,
      )
      .to(q(out, "[data-ring]"), { scale: 1.18, autoAlpha: 0, duration: 0.8 }, 0)
      .to(
        q(out, "[data-reveal]"),
        { y: -18, autoAlpha: 0, stagger: 0.04, duration: 0.45, ease: "power2.in" },
        0,
      )
      .set(inn, { autoAlpha: 1 }, 0.35)
      .fromTo(
        q(inn, "[data-char]"),
        { yPercent: 115 },
        {
          yPercent: 0,
          stagger: { each: 0.035, from: from_ },
          duration: 1,
          ease: "power4.out",
        },
        0.45,
      )
      .fromTo(
        q(inn, "[data-art]"),
        { x: d * vw * 0.3, rotation: d * 10, scale: 0.92, autoAlpha: 0 },
        {
          x: 0,
          rotation: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 1.1,
          ease: "power3.out",
        },
        0.4,
      )
      .fromTo(
        q(inn, "[data-ring]"),
        { scale: 0.8, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1.2, ease: "power3.out" },
        0.4,
      )
      .fromTo(
        q(inn, "[data-reveal]"),
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.8, ease: "power3.out" },
        0.75,
      );
    return true;
  }, [products, COUNT]);

  const next = useCallback(() => go(indexRef.current + 1, 1), [go]);
  const prev = useCallback(() => go(indexRef.current - 1, -1), [go]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slides = slideRefs.current;
    const activeArt = () =>
      slides[indexRef.current]?.querySelector<HTMLElement>("[data-art]") ?? null;

    /* Entrée + mouvements ambiants */
    const ctx = gsap.context(() => {
      const first = slides[indexRef.current];
      if (first && !reduce) {
        gsap.from(first.querySelectorAll("[data-char]"), {
          yPercent: 115,
          stagger: 0.05,
          duration: 1.3,
          ease: "power4.out",
          delay: 0.15,
        });
        gsap.from(first.querySelector("[data-art]"), {
          autoAlpha: 0,
          scale: 0.9,
          y: 40,
          duration: 1.4,
          ease: "power3.out",
          delay: 0.3,
        });
        gsap.from(first.querySelectorAll("[data-reveal]"), {
          autoAlpha: 0,
          y: 24,
          stagger: 0.07,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.8,
        });
      }

      if (!reduce) {
        gsap.to("[data-float]", {
          y: -14,
          rotation: 1.2,
          duration: 3.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.4, from: "random" },
        });
      }
    }, root);

    /* Parallaxe souris */
    const tilts = root.querySelectorAll("[data-tilt]");
    const words = root.querySelectorAll("[data-word]");
    const onMove = (event: PointerEvent) => {
      if (reduce || event.pointerType !== "mouse") return;
      const mx = event.clientX / window.innerWidth - 0.5;
      const my = event.clientY / window.innerHeight - 0.5;
      gsap.to(tilts, { x: mx * 30, y: my * 18, duration: 1.2, ease: "power3.out", overwrite: "auto" });
      gsap.to(words, { x: -mx * 44, duration: 1.4, ease: "power3.out", overwrite: "auto" });
    };

    /* Molette / trackpad */
    let lastWheel = 0;
    const onWheel = (event: WheelEvent) => {
      const now = performance.now();
      const fresh = now - lastWheel > 180;
      lastWheel = now;
      if (cartOpenRef.current || infoOpenRef.current || lookbookOpenRef.current || now < lockUntil.current) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 8) return;
      if (!fresh && Math.abs(delta) < 60) return;
      if (delta > 0) next();
      else prev();
    };

    /* Glisser */
    let startX = 0;
    let dx = 0;
    let dragging = false;
    const onDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest("button,a,[data-nodrag]")) return;
      dragging = true;
      startX = event.clientX;
      dx = 0;
      draggedRef.current = false;
    };
    const onDrag = (event: PointerEvent) => {
      if (!dragging) return;
      dx = event.clientX - startX;
      if (Math.abs(dx) > 6) draggedRef.current = true;
      const art = activeArt();
      if (art) {
        gsap.to(art, { x: dx * 0.5, rotation: dx * 0.02, duration: 0.35, ease: "power3.out", overwrite: "auto" });
      }
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      // Un glisser qui ne déclenche aucune transition (trop court, ou animation en cours) ramène la pièce.
      const moved = Math.abs(dx) > 70 && (dx < 0 ? next() : prev());
      if (!moved) {
        const art = activeArt();
        if (art) {
          gsap.to(art, { x: 0, rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.6)", overwrite: "auto" });
        }
      }
      dx = 0;
    };

    /* Clavier */
    const onKey = (event: KeyboardEvent) => {
      if (cartOpenRef.current || infoOpenRef.current || lookbookOpenRef.current) return;
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)) next();
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) prev();
      else if (event.key === "Home") go(0);
      else if (event.key === "End") go(COUNT - 1);
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("wheel", onWheel, { passive: true });
    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);

    return () => {
      ctx.revert();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [go, next, prev, COUNT]);

  const first = products[initialIndex].tone;
  const activeScenes = products[index].scenes ?? [];

  const closeLookbook = useCallback(() => setLookbookOpen(false), []);

  return (
    <main
      ref={rootRef}
      className="relative h-svh w-full touch-none select-none overflow-hidden"
      style={{ backgroundColor: first.bg, color: first.ink }}
    >
      <div aria-hidden className="tx-grain" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 px-5 pt-6 sm:px-10 sm:pt-8">
        <div className="pointer-events-auto shrink-0">
          <h1 className="m-0">
            <Logo className="text-3xl sm:text-5xl" imageUrl={logoUrl} />
          </h1>
          <p className="mt-2 hidden max-w-[17rem] text-[10px] uppercase leading-relaxed tracking-[0.26em] opacity-60 sm:block">
            {tagline}
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-4 whitespace-nowrap pt-1.5 text-[10px] sm:gap-6 sm:pt-2 sm:text-[11px]">
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="uppercase tracking-[0.16em] opacity-80 transition-opacity hover:opacity-100 sm:tracking-[0.24em]"
          >
            <span className="sm:hidden">Infos</span>
            <span className="hidden sm:inline">Informations</span>
          </button>
          <Link
            href="/compte"
            className="uppercase tracking-[0.16em] opacity-80 transition-opacity hover:opacity-100 sm:tracking-[0.24em]"
          >
            Compte
          </Link>
          <CartButton />
        </div>
      </header>

      {products.map((product, i) => (
        <section
          key={product.slug}
          ref={(el) => {
            slideRefs.current[i] = el;
          }}
          inert={i !== index}
          aria-roledescription="slide"
          aria-label={`${i + 1} sur ${COUNT} — ${product.name}`}
          className={`absolute inset-0 ${i === initialIndex ? "" : "invisible opacity-0"}`}
        >
          {/* Scène : mot géant, halo, pièce */}
          <div className="absolute inset-x-0 bottom-60 top-16 sm:bottom-48">
            <div
              data-word
              aria-hidden
              className="tx-ghost absolute inset-0 flex items-center justify-center font-serif leading-none tracking-[-0.02em] whitespace-nowrap"
              style={{ fontSize: wordSize(product.word) }}
            >
              {product.word.split("").map((char, c) => (
                <span key={c} className="inline-block overflow-hidden pb-[0.06em]">
                  <span data-char className="inline-block">
                    {char === " " ? "\u00a0" : char}
                  </span>
                </span>
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                data-ring
                aria-hidden
                className="aspect-square h-[92%] rounded-full border border-current opacity-20"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                data-art
                className={`h-[88%] max-w-[92%] aspect-[5/6] ${product.scenes?.length ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (product.scenes?.length && !draggedRef.current) setLookbookOpen(true);
                }}
              >
                <div data-tilt className="h-full w-full">
                  <div data-float className="relative h-full w-full">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 90vw, 40vw"
                        className="object-contain"
                        priority={i === initialIndex}
                      />
                    ) : (
                      <Garment
                        kind={product.kind}
                        tone={product.tone}
                        className="h-full w-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Légende */}
          <div className="absolute inset-x-0 bottom-16 z-20 flex flex-col gap-5 px-6 sm:flex-row sm:items-end sm:justify-between sm:px-10">
            <div>
              <p data-reveal className="text-[10px] uppercase tracking-[0.3em] opacity-60">
                Pièce {pad(i)} — {product.silhouette}
              </p>
              <h2
                data-reveal
                className="mt-2 font-serif text-3xl leading-none sm:text-5xl"
              >
                {product.name}
              </h2>
              <p data-reveal className="mt-3 text-sm tracking-[0.12em]">
                {formatPrice(product.price)}
                <span className="opacity-60"> · Édition {product.edition}</span>
              </p>
              <Gauge product={product} avail={avail[product.slug]} />
              {product.scenes && product.scenes.length > 0 && (
                <button
                  type="button"
                  data-reveal
                  onClick={() => setLookbookOpen(true)}
                  className="mt-4 text-[10px] uppercase tracking-[0.26em] underline decoration-current/40 underline-offset-8 transition-opacity hover:decoration-current"
                >
                  Voir les looks · {product.scenes.length}
                </button>
              )}
              <ShareButton slug={product.slug} name={product.name} />
            </div>

            <div className="flex flex-col gap-4 sm:items-end">
              <p
                data-reveal
                className="hidden max-w-xs text-sm leading-relaxed opacity-75 sm:block sm:text-right"
              >
                {product.description}
              </p>
              <p
                data-reveal
                className="hidden text-[10px] uppercase tracking-[0.26em] opacity-55 sm:block"
              >
                {product.fabric}
              </p>
              <div data-reveal>
                <Reserve
                  slug={product.slug}
                  name={product.name}
                  price={product.price}
                  sizes={product.sizes}
                  available={avail[product.slug] ?? {}}
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Navigation */}
      <nav
        aria-label="Pièces de l'exposition"
        className="absolute inset-x-0 bottom-4 z-30 flex items-center justify-between px-6 sm:px-10"
      >
        <p className="w-24 text-[11px] tracking-[0.3em] tabular-nums opacity-70" aria-live="polite">
          {pad(index)} / {pad(COUNT - 1)}
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Pièce précédente"
            className="px-2 py-2 text-lg opacity-70 transition-opacity hover:opacity-100"
          >
            ←
          </button>
          <ul className="flex items-center gap-1">
            {products.map((product, i) => (
              <li key={product.slug}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${pad(i)} — ${product.name}`}
                  aria-current={i === index}
                  className="group flex h-8 items-center px-1"
                >
                  <span
                    className={`block h-px bg-current transition-all duration-700 ${
                      i === index ? "w-10 opacity-100 sm:w-14" : "w-3 opacity-40 group-hover:opacity-80 sm:w-5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={next}
            aria-label="Pièce suivante"
            className="px-2 py-2 text-lg opacity-70 transition-opacity hover:opacity-100"
          >
            →
          </button>
        </div>

        <p
          className={`hidden w-24 text-right text-[10px] uppercase tracking-[0.26em] transition-opacity duration-700 sm:block ${
            hinted ? "opacity-60" : "opacity-0"
          }`}
        >
          Défiler · Glisser
        </p>
        <span className="w-24 sm:hidden" aria-hidden />
      </nav>

      <InfoPanel open={infoOpen} onClose={() => setInfoOpen(false)} pages={pages} />

      {lookbookOpen && activeScenes.length > 0 && (
        <Lookbook
          key={products[index].slug}
          product={products[index]}
          scenes={activeScenes}
          onClose={closeLookbook}
        />
      )}
    </main>
  );
}

/** Jauge de rareté : pièces restantes sur la taille de l'édition. */
function Gauge({
  product,
  avail,
}: {
  product: Product;
  avail?: Record<string, number>;
}) {
  if (!avail) return null;
  const left = Object.values(avail).reduce((sum, n) => sum + n, 0);
  const total = editionTotal(product);
  const limited = isLimited(product);

  const text =
    left === 0
      ? "Épuisé"
      : left <= 5
        ? `Dernières pièces · ${left}`
        : limited
          ? `Il reste ${left} pièces sur ${total}`
          : "Disponible";

  return (
    <div data-reveal className="mt-3 w-56">
      {limited && (
        <div className="h-px w-full bg-current/25">
          <div
            className="h-px bg-current transition-[width] duration-700"
            style={{ width: `${Math.min(100, (left / total) * 100)}%` }}
          />
        </div>
      )}
      <p className="mt-2 text-[10px] uppercase tracking-[0.26em] opacity-70">{text}</p>
    </div>
  );
}
