"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = "[data-reveal]";
const PARALLAX_SELECTOR = "[data-parallax]";
const DRIFT_SELECTOR = "[data-drift]";
const STAGGER_GROUP_SELECTOR = "[data-stagger-group]";
const SCENE_SELECTOR = "[data-scene-pin]";
const SCENE_COPY_SELECTOR = "[data-scene-copy]";
const SCENE_FOCUS_SELECTOR = "[data-scene-focus]";
const SCENE_STEP_SELECTOR = "[data-scene-step]";
const RUNWAY_TRACK_SELECTOR = "[data-runway-track]";

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    let animationFrameId = 0;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const setupMotion = async () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const [{ default: Lenis }, gsapModule, scrollTriggerModule] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);

      if (cancelled) {
        return;
      }

      const gsap = gsapModule.gsap ?? gsapModule.default ?? gsapModule;
      const ScrollTrigger =
        scrollTriggerModule.ScrollTrigger ?? scrollTriggerModule.default;

      gsap.registerPlugin(ScrollTrigger);

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const enableHeavyScrollFx = isDesktop && !isCoarse;

      if (enableHeavyScrollFx) {
        document.documentElement.classList.add("sw-motion-active");
      }

      const lenis = new Lenis({
        autoRaf: false,
        duration: enableHeavyScrollFx ? 1.2 : 1,
        smoothWheel: true,
        wheelMultiplier: enableHeavyScrollFx ? 0.92 : 1,
        touchMultiplier: enableHeavyScrollFx ? 1.03 : 1,
        lerp: enableHeavyScrollFx ? 0.09 : 0.14,
      });

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameId = window.requestAnimationFrame(raf);
      };

      animationFrameId = window.requestAnimationFrame(raf);

      const context = gsap.context(() => {
        const revealElements = Array.from(
          document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
        );

        revealElements.forEach((element, index) => {
          const rawDelay = Number.parseFloat(
            element.dataset.revealDelay ?? "0",
          );
          const delay = Number.isNaN(rawDelay) ? (index % 3) * 0.05 : rawDelay;

          gsap.fromTo(
            element,
            {
              y: enableHeavyScrollFx ? 58 : 30,
              autoAlpha: 0,
              filter: enableHeavyScrollFx ? "blur(8px)" : "blur(3px)",
            },
            {
              y: 0,
              autoAlpha: 1,
              filter: "blur(0px)",
              duration: enableHeavyScrollFx ? 1.2 : 0.8,
              delay,
              ease: "power3.out",
              clearProps: "filter,willChange",
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                once: true,
              },
            },
          );
        });

        const driftElements = Array.from(
          document.querySelectorAll<HTMLElement>(DRIFT_SELECTOR),
        );

        driftElements.forEach((element) => {
          if (!enableHeavyScrollFx) {
            gsap.fromTo(
              element,
              {
                y: 16,
                autoAlpha: 0.85,
              },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.65,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 90%",
                  once: true,
                },
              },
            );
            return;
          }

          gsap.fromTo(
            element,
            {
              y: 24,
              scale: 0.985,
            },
            {
              y: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 95%",
                end: "top 25%",
                scrub: 0.9,
              },
            },
          );
        });

        if (enableHeavyScrollFx) {
          const scenes = Array.from(
            document.querySelectorAll<HTMLElement>(SCENE_SELECTOR),
          );

          scenes.forEach((scene) => {
            const copies = Array.from(
              scene.querySelectorAll<HTMLElement>(SCENE_COPY_SELECTOR),
            );
            const steps = Array.from(
              scene.querySelectorAll<HTMLElement>(SCENE_STEP_SELECTOR),
            );
            const focus = scene.querySelector<HTMLElement>(SCENE_FOCUS_SELECTOR);
            const distanceRaw = Number.parseFloat(
              scene.dataset.sceneDistance ?? "200",
            );
            const distance = Number.isNaN(distanceRaw) ? 200 : distanceRaw;

            if (copies.length === 0) {
              return;
            }

            gsap.set(copies, {
              autoAlpha: 0,
              y: 40,
            });
            gsap.set(copies[0], {
              autoAlpha: 1,
              y: 0,
            });

            if (steps.length > 0) {
              gsap.set(steps, {
                autoAlpha: 0.35,
                scale: 0.76,
              });
              gsap.set(steps[0], {
                autoAlpha: 1,
                scale: 1,
              });
            }

            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: scene,
                start: "top top",
                end: `+=${distance}%`,
                scrub: 0.9,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            });

            if (focus) {
              timeline.fromTo(
                focus,
                {
                  scale: 1.12,
                  rotate: -2,
                },
                {
                  scale: 1,
                  rotate: 0,
                  ease: "none",
                  duration: 1,
                },
                0,
              );
            }

            const slice = 1 / copies.length;

            copies.forEach((copy, index) => {
              const start = index * slice;

              if (index > 0) {
                timeline.to(
                  copies[index - 1],
                  {
                    autoAlpha: 0,
                    y: -24,
                    duration: 0.18,
                    ease: "power2.in",
                  },
                  Math.max(start - 0.1, 0),
                );
              }

              timeline.fromTo(
                copy,
                {
                  autoAlpha: 0,
                  y: 36,
                },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.22,
                  ease: "power3.out",
                },
                start,
              );

              if (steps[index]) {
                timeline.to(
                  steps[index],
                  {
                    autoAlpha: 1,
                    scale: 1,
                    duration: 0.16,
                  },
                  start,
                );
              }

              if (index > 0 && steps[index - 1]) {
                timeline.to(
                  steps[index - 1],
                  {
                    autoAlpha: 0.35,
                    scale: 0.76,
                    duration: 0.16,
                  },
                  start,
                );
              }
            });
          });
        }

        const parallaxElements = Array.from(
          document.querySelectorAll<HTMLElement>(PARALLAX_SELECTOR),
        );

        if (!enableHeavyScrollFx) {
          parallaxElements.forEach((element) => {
            gsap.set(element, {
              clearProps: "transform",
            });
          });
        }

        parallaxElements.forEach((element) => {
          if (!enableHeavyScrollFx) {
            return;
          }

          const amount = Number.parseFloat(element.dataset.parallax ?? "10");
          if (Number.isNaN(amount)) {
            return;
          }

          const trigger =
            element.closest<HTMLElement>("[data-parallax-root]") ??
            element.parentElement ??
            element;

          gsap.to(element, {
            yPercent: amount,
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.1,
            },
          });
        });

        const staggerGroups = Array.from(
          document.querySelectorAll<HTMLElement>(STAGGER_GROUP_SELECTOR),
        );

        staggerGroups.forEach((group) => {
          const children = Array.from(group.children);
          if (children.length === 0) {
            return;
          }

          gsap.fromTo(
            children,
            {
              y: 28,
              autoAlpha: 0,
            },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.95,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: {
                trigger: group,
                start: "top 84%",
                once: true,
              },
            },
          );
        });

        const progressBar = document.querySelector<HTMLElement>(
          ".sw-scroll-progress",
        );

        if (progressBar) {
          gsap.fromTo(
            progressBar,
            {
              scaleX: 0,
              transformOrigin: "0% 50%",
            },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: document.documentElement,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
              },
            },
          );
        }

        const runwayTracks = Array.from(
          document.querySelectorAll<HTMLElement>(RUNWAY_TRACK_SELECTOR),
        );

        runwayTracks.forEach((track) => {
          if (!enableHeavyScrollFx) {
            return;
          }

          gsap.to(track, {
            xPercent: -18,
            ease: "none",
            scrollTrigger: {
              trigger: track,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.75,
            },
          });
        });
      });

      const refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 140);

      cleanup = () => {
        window.clearTimeout(refreshTimer);
        window.cancelAnimationFrame(animationFrameId);
        lenis.off("scroll", onScroll);
        lenis.destroy();
        context.revert();
        document.documentElement.classList.remove("sw-motion-active");
      };
    };

    setupMotion().catch(() => {
      // Keep the page usable if motion libs fail to load.
      document.documentElement.classList.remove("sw-motion-active");
    });

    return () => {
      cancelled = true;
      if (cleanup) {
        cleanup();
      } else {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [pathname]);

  return null;
}
