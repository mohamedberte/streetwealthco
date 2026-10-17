"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Entrée des pages secondaires : les blocs se dévoilent l'un après l'autre, comme une scène. */
export function PageReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(node.children, {
        y: 18,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.09,
        ease: "power3.out",
        clearProps: "all",
      });
    }, node);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={ref} className={className}>
      {children}
    </main>
  );
}
