"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { formatPrice, type Product, type ProductScene } from "@/lib/products";

/** Durée d'un look en lecture automatique (secondes). */
const SLIDE_S = 7;
const LOCK_MS = 1300;

const pad = (n: number) => String(n + 1).padStart(2, "0");
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lent zoom continu sur la photo du look affiché. */
function kenBurns(scene: HTMLElement | null) {
  const target = scene?.querySelector<HTMLElement>("[data-kb]");
  if (!target || prefersReduced()) return;
  gsap.fromTo(
    target,
    { scale: 1 },
    { scale: 1.12, duration: SLIDE_S + 3, ease: "none", overwrite: "auto" },
  );
}

/**
 * Vue « Looks » d'une pièce : photos portées dans différents lieux, plein écran, avec
 * transitions animées (voile, parallaxe, zoom lent) et lecture automatique mettable en pause.
 * Navigation : flèches, molette, glisser, points de progression. Échap pour fermer.
 */
export function Lookbook({
  product,
  scenes,
  onClose,
}: {
  product: Product;
  scenes: ProductScene[];
  onClose: () => void;
}) {
  const COUNT = scenes.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const indexRef = useRef(0);
  const lockUntil = useRef(0);
  const autoRef = useRef<gsap.core.Tween | null>(null);
  const goRef = useRef<(to: number, dir?: 1 | -1) => void>(() => {});
  /* Monté uniquement après un clic : pas de rendu serveur, `window` est disponible. */
  const [playing, setPlaying] = useState(() => !prefersReduced());
  const playingRef = useRef(playing);
  const [index, setIndex] = useState(0);

  /* Barre de progression du look affiché ; à la fin, passage automatique au suivant. */
  const startAuto = useCallback(
    (i: number) => {
      autoRef.current?.kill();
      autoRef.current = null;
      barRefs.current.forEach((bar, b) => {
        if (bar) gsap.set(bar, { scaleX: b < i ? 1 : 0 });
      });
      const bar = barRefs.current[i];
      if (!bar || COUNT < 2) return;
      autoRef.current = gsap.to(bar, {
        scaleX: 1,
        duration: SLIDE_S,
        ease: "none",
        paused: !playingRef.current,
        onComplete: () => goRef.current(indexRef.current + 1, 1),
      });
    },
    [COUNT],
  );

  const go = useCallback(
    (to: number, dir?: 1 | -1) => {
      const now = performance.now();
      const from = indexRef.current;
      const target = ((to % COUNT) + COUNT) % COUNT;
      const out = sceneRefs.current[from];
      const inn = sceneRefs.current[target];
      if (!out || !inn || target === from || now < lockUntil.current) return;

      const d = dir ?? (target > from ? 1 : -1);
      const q = (el: HTMLElement, selector: string) => el.querySelectorAll<HTMLElement>(selector);

      lockUntil.current = now + LOCK_MS;
      indexRef.current = target;
      setIndex(target);
      startAuto(target);

      gsap.set(inn, { autoAlpha: 1, zIndex: 2 });
      gsap.set(out, { zIndex: 1 });
      kenBurns(inn);

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          gsap.set(out, { autoAlpha: 0, zIndex: 0 });
          gsap.killTweensOf(q(out, "[data-kb]"));
          gsap.set(q(out, "[data-kb]"), { scale: 1 });
          gsap.set(q(out, "[data-px]"), { xPercent: 0 });
        },
      });
      if (prefersReduced()) tl.timeScale(12);

      tl.to(q(out, "[data-t]"), { yPercent: -110, stagger: 0.03, duration: 0.5, ease: "power3.in" }, 0)
        .to(q(out, "[data-c]"), { autoAlpha: 0, y: -14, duration: 0.4, ease: "power2.in" }, 0)
        .to(q(out, "[data-px]"), { xPercent: -d * 10, duration: 1.15 }, 0)
        .fromTo(
          q(inn, "[data-frame]"),
          { clipPath: d > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: "power4.inOut" },
          0,
        )
        .fromTo(
          q(inn, "[data-px]"),
          { xPercent: d * 8 },
          { xPercent: 0, duration: 1.4, ease: "power3.out" },
          0,
        )
        .fromTo(
          q(inn, "[data-t]"),
          { yPercent: 110 },
          { yPercent: 0, stagger: 0.06, duration: 0.9, ease: "power4.out" },
          0.55,
        )
        .fromTo(
          q(inn, "[data-c]"),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8, ease: "power3.out" },
          0.75,
        );
    },
    [COUNT, startAuto],
  );

  useEffect(() => {
    goRef.current = go;
  }, [go]);

  const toggle = () => {
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
    autoRef.current?.paused(!next);
  };

  /* Ouverture : entrée animée, focus, puis zoom lent et lecture du premier look. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const first = sceneRefs.current[0];
    const ctx = gsap.context(() => {
      if (prefersReduced() || !first) return;
      gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(
        first.querySelector("[data-frame]"),
        { clipPath: "inset(10% 10% 10% 10%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.out" },
      );
      gsap.fromTo(
        first.querySelectorAll("[data-t]"),
        { yPercent: 110 },
        { yPercent: 0, stagger: 0.06, duration: 1, ease: "power4.out", delay: 0.4 },
      );
      gsap.fromTo(
        first.querySelectorAll("[data-c]"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8, ease: "power3.out", delay: 0.7 },
      );
    }, root);
    kenBurns(first ?? null);
    startAuto(0);

    return () => {
      autoRef.current?.kill();
      ctx.revert();
      opener?.focus?.();
    };
  }, [startAuto]);

  /* Clavier, molette, glisser */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)) {
        goRef.current(indexRef.current + 1, 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        goRef.current(indexRef.current - 1, -1);
      } else if (event.key === "Tab") {
        /* Le focus reste dans la vue tant qu'elle est ouverte. */
        const focusable = [...root.querySelectorAll<HTMLElement>("button:not([disabled])")].filter(
          (el) => !el.closest("[inert]"),
        );
        if (focusable.length === 0) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === firstEl || !root.contains(active))) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && (active === lastEl || !root.contains(active))) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    };

    let lastWheel = 0;
    const onWheel = (event: WheelEvent) => {
      const now = performance.now();
      const fresh = now - lastWheel > 180;
      lastWheel = now;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 8 || (!fresh && Math.abs(delta) < 60)) return;
      goRef.current(indexRef.current + (delta > 0 ? 1 : -1), delta > 0 ? 1 : -1);
    };

    let startX = 0;
    let tracking = false;
    const onDown = (event: PointerEvent) => {
      tracking = !(event.target as HTMLElement).closest("button");
      startX = event.clientX;
    };
    const onUp = (event: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 60) goRef.current(indexRef.current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    };

    window.addEventListener("keydown", onKey);
    root.addEventListener("wheel", onWheel, { passive: true });
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerup", onUp);
    };
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      data-nodrag
      role="dialog"
      aria-modal="true"
      aria-label={`Looks — ${product.name}`}
      className="fixed inset-0 z-[60] touch-none select-none overflow-hidden bg-brown text-ivory"
    >
      {scenes.map((scene, i) => (
        <figure
          key={scene.id}
          ref={(el) => {
            sceneRefs.current[i] = el;
          }}
          inert={i !== index}
          aria-roledescription="slide"
          aria-label={`${i + 1} sur ${COUNT} — ${scene.title}`}
          className={`absolute inset-0 m-0 ${i === 0 ? "" : "invisible opacity-0"}`}
        >
          <div data-frame className="absolute inset-0 overflow-hidden">
            <div data-px className="absolute inset-y-0" style={{ left: "-10%", right: "-10%" }}>
              <div data-kb className="absolute inset-0">
                <Image
                  src={scene.image}
                  alt={`${product.name} — ${scene.title}`}
                  fill
                  sizes="120vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            </div>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(26,15,10,.82) 0%, rgba(26,15,10,.25) 40%, rgba(26,15,10,0) 65%), linear-gradient(to bottom, rgba(26,15,10,.45), rgba(26,15,10,0) 22%)",
              }}
            />
          </div>

          <figcaption className="absolute inset-x-6 bottom-28 z-10 sm:inset-x-10 sm:bottom-32">
            <p data-c className="text-[10px] uppercase tracking-[0.3em] text-ivory/70">
              Look {pad(i)}
            </p>
            <h3 className="mt-2 font-serif text-4xl leading-[1.05] sm:text-6xl">
              {scene.title.split(" ").map((word, w) => (
                <span key={w} className="mr-[0.25em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <span data-t className="inline-block">
                    {word}
                  </span>
                </span>
              ))}
            </h3>
            {scene.caption && (
              <p data-c className="mt-3 max-w-md text-sm leading-relaxed text-ivory/80">
                {scene.caption}
              </p>
            )}
          </figcaption>
        </figure>
      ))}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <div className="pointer-events-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ivory/70">Looks</p>
          <p className="mt-1 font-serif text-xl sm:text-2xl">{product.name}</p>
          <p className="mt-1 text-xs tracking-[0.12em] text-ivory/70">{formatPrice(product.price)}</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-6 pt-1 text-[11px] uppercase tracking-[0.24em]">
          {COUNT > 1 && (
            <button type="button" onClick={toggle} className="opacity-80 transition-opacity hover:opacity-100">
              {playing ? "Pause" : "Lecture"}
            </button>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="opacity-80 transition-opacity hover:opacity-100"
          >
            Retour à la pièce
          </button>
        </div>
      </div>

      {COUNT > 1 && (
        <nav
          aria-label="Looks"
          className="absolute inset-x-0 bottom-6 z-20 flex items-center gap-4 px-6 sm:px-10"
        >
          <p className="w-16 text-[11px] tabular-nums tracking-[0.3em] text-ivory/70" aria-live="polite">
            {pad(index)} / {pad(COUNT - 1)}
          </p>
          <ul className="flex flex-1 items-center gap-2">
            {scenes.map((scene, i) => (
              <li key={scene.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Look ${pad(i)} — ${scene.title}`}
                  aria-current={i === index}
                  className="block w-full py-3"
                >
                  <span className="block h-px w-full bg-ivory/25">
                    <span
                      ref={(el) => {
                        barRefs.current[i] = el;
                      }}
                      className="block h-px origin-left bg-ivory"
                      style={{ transform: "scaleX(0)" }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1 text-lg">
            <button
              type="button"
              onClick={() => go(index - 1, -1)}
              aria-label="Look précédent"
              className="px-2 py-2 opacity-70 transition-opacity hover:opacity-100"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(index + 1, 1)}
              aria-label="Look suivant"
              className="px-2 py-2 opacity-70 transition-opacity hover:opacity-100"
            >
              →
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
