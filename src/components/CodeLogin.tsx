"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { sendCode, verifyCode } from "@/app/compte/actions";

const field =
  "mt-2 block w-full border border-border bg-white px-3 py-3 text-base text-brown outline-none focus:border-brown";
const label = "block text-[10px] uppercase tracking-[0.22em] text-muted";
const primary =
  "w-full bg-brown px-4 py-3.5 text-[11px] uppercase tracking-[0.24em] text-white hover:bg-brown-soft disabled:opacity-50";

/**
 * Connexion / création de compte en deux gestes : l'e-mail, puis le code reçu.
 * Pas de mot de passe ; le compte se crée tout seul au premier code valide.
 */
export function CodeLogin({
  defaultEmail = "",
  next = "/compte",
  hint,
}: {
  defaultEmail?: string;
  next?: string;
  hint?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Chaque étape entre en glissant, élément par élément (sauf si l'animation est réduite).
  useEffect(() => {
    const root = rootRef.current;
    const form = root?.querySelector("form");
    if (!root || !form || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(form.children, {
        y: 14,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: "power3.out",
        clearProps: "all",
      });
    }, root);
    return () => ctx.revert();
  }, [step]);

  // Erreur : l'encart se dévoile au lieu d'apparaître brutalement.
  useEffect(() => {
    const root = rootRef.current;
    if (!error || !root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const alert = root.querySelector('[role="alert"]');
    if (alert) gsap.from(alert, { x: -8, autoAlpha: 0, duration: 0.45, ease: "power3.out", clearProps: "all" });
  }, [error]);
  async function onEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await sendCode(email);
    setBusy(false);
    if (result.ok) setStep("code");
    else setError(result.error);
  }

  async function onCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setBusy(true);
    setError("");
    const result = await verifyCode(email, code);
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    router.push(next);
    router.refresh();
  }

  if (step === "code") {
    return (
      <div ref={rootRef}>
      <form onSubmit={onCode} className="w-full">
        <p className="text-sm leading-relaxed text-brown-soft">
          Un code vient d&apos;être envoyé à <strong className="font-medium text-brown">{email}</strong>.
          Il est valable une heure.
        </p>
        <label htmlFor="login-code" className={`${label} mt-6`}>
          Code reçu par e-mail
        </label>
        <input
          id="login-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,10}"
          minLength={6}
          maxLength={10}
          required
          autoFocus
          className={`${field} text-center text-2xl tracking-[0.5em]`}
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-brown">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${primary} mt-5`}>
          {busy ? "Vérification…" : "Valider"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError("");
          }}
          className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted underline hover:text-brown"
        >
          Changer d&apos;adresse ou renvoyer un code
        </button>
      </form>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
    <form onSubmit={onEmail} className="w-full">
      <label htmlFor="login-email" className={label}>
        Votre e-mail
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        autoFocus={!defaultEmail}
        className={field}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-brown">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${primary} mt-5`}>
        {busy ? "Envoi…" : "Recevoir mon code"}
      </button>
      {hint && <p className="mt-4 text-xs leading-relaxed text-muted">{hint}</p>}
    </form>
    </div>
  );
}
