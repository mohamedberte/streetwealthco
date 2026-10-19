"use client";

import { useEffect, useState } from "react";
import { joinWaitlist } from "@/app/actions";
import { formatOpening } from "@/lib/paris";
import { DROP_SIZE } from "@/lib/products";

/**
 * Millisecondes restantes avant l'ouverture de la vente (null : déjà ouverte ou sans date).
 * L'horloge est calée sur celle du serveur (`serverNow`), pas sur celle de l'appareil.
 */
function useRemaining(opensAt: string | undefined, serverNow: number) {
  const target = opensAt ? Date.parse(opensAt) : Number.NaN;
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    if (!Number.isFinite(target) || target <= serverNow) return;
    const offset = serverNow - Date.now();
    const tick = () => {
      const current = Date.now() + offset;
      setNow(current);
      if (current >= target) window.clearInterval(timer);
    };
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target, serverNow]);

  return Number.isFinite(target) && target > now ? target - now : null;
}

/**
 * Suivi complet : `remaining` (ms, null si ouverte) et `opened` (vrai uniquement si la vente
 * vient de s'ouvrir sous les yeux du visiteur, pour adoucir le changement d'etat).
 */
function useDrop(opensAt: string | undefined, serverNow: number) {
  const remaining = useRemaining(opensAt, serverNow);
  const [wasUpcoming, setWasUpcoming] = useState(remaining !== null);
  if (remaining !== null && !wasUpcoming) setWasUpcoming(true);
  return { remaining, opened: wasUpcoming && remaining === null };
}

const two = (n: number) => String(n).padStart(2, "0");

function segments(ms: number) {
  const total = Math.ceil(ms / 1000);
  const days = Math.floor(total / 86_400);
  return [
    ...(days > 0 ? [{ value: String(days), label: days > 1 ? "jours" : "jour" }] : []),
    { value: two(Math.floor((total % 86_400) / 3600)), label: "heures" },
    { value: two(Math.floor((total % 3600) / 60)), label: "min" },
    { value: two(total % 60), label: "sec" },
  ];
}

/** Un chiffre : l'ancien s'efface vers le bas pendant que le nouveau descend doucement. */
function Digit({ value }: { value: string }) {
  const [shown, setShown] = useState(value);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  if (value !== shown) {
    setLeaving(shown);
    setShown(value);
    setChanged(true);
  }
  return (
    <span className="relative inline-block w-[0.56em] overflow-hidden text-center leading-[1.15]">
      {leaving !== null && (
        <span key={`out-${leaving}`} className="tx-digit-out" onAnimationEnd={() => setLeaving(null)}>
          {leaving}
        </span>
      )}
      <span key={shown} className={`inline-block ${changed ? "tx-digit-in" : ""}`}>
        {shown}
      </span>
    </span>
  );
}

/** Colonne de gauche : compte a rebours tant que la vente n'est pas ouverte, sinon `fallback`. */
export function DropStatus({
  opensAt,
  serverNow,
  fallback,
}: {
  opensAt?: string;
  serverNow: number;
  fallback: React.ReactNode;
}) {
  const { remaining, opened } = useDrop(opensAt, serverNow);
  if (remaining === null || !opensAt) {
    return opened ? <div className="tx-rise">{fallback}</div> : <>{fallback}</>;
  }
  return (
    <div data-reveal className="mt-3">
      <p className="text-[11px] uppercase tracking-[0.26em] opacity-85">
        Ouverture · {formatOpening(opensAt)}
      </p>
      <time dateTime={opensAt} className="sr-only">
        {formatOpening(opensAt)}
      </time>
      <div aria-hidden className="mt-4 flex items-start gap-3 font-serif text-3xl leading-none sm:gap-7 sm:text-5xl">
        {segments(remaining).map(({ value, label }, index) => (
          <div key={label} className="flex items-start gap-3 sm:gap-7">
            {index > 0 && <span className="mt-1 h-8 w-px bg-current opacity-20 sm:h-10" />}
            <div>
              <div>
                {value.split("").map((digit, i) => (
                  <Digit key={i} value={digit} />
                ))}
              </div>
              <p className="mt-2 font-sans text-[9px] uppercase tracking-[0.28em] opacity-60">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Colonne de droite : « me prévenir » tant que la vente n'est pas ouverte, sinon `children` (commande). */
export function DropAlert({
  slug,
  opensAt,
  serverNow,
  children,
}: {
  slug: string;
  opensAt?: string;
  serverNow: number;
  children: React.ReactNode;
}) {
  const { remaining, opened } = useDrop(opensAt, serverNow);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  if (remaining === null) {
    return opened ? <div className="tx-rise">{children}</div> : <>{children}</>;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    const result = await joinWaitlist({ slug, size: DROP_SIZE, email });
    if (result.ok) {
      setState("ok");
    } else {
      setState("error");
      setError(result.error ?? "Inscription impossible.");
    }
  }

  return (
    <div data-nodrag className="relative">
      {open && (
        <form
          onSubmit={submit}
          className="tx-pop absolute bottom-full right-0 mb-3 w-72 border border-current/30 bg-current/10 p-4 backdrop-blur-md"
        >
          {state === "ok" ? (
            <p className="text-sm leading-relaxed">
              C&apos;est noté. Vous serez prévenu par e-mail à l&apos;ouverture de la vente.
            </p>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.2em]">Être prévenu à l&apos;ouverture</p>
              <label className="sr-only" htmlFor={`drop-${slug}`}>
                Adresse e-mail
              </label>
              <input
                id={`drop-${slug}`}
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                className="mt-3 w-full border border-current/40 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:opacity-50 focus:border-current"
              />
              {state === "error" && (
                <p role="alert" className="mt-2 text-xs">
                  {error}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="tx-btn flex-1 px-4 py-2.5 disabled:opacity-50"
                >
                  Me prévenir
                </button>
                <button type="button" onClick={() => setOpen(false)} className="tx-btn px-4 py-2.5">
                  Fermer
                </button>
              </div>
            </>
          )}
        </form>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="tx-btn w-full sm:w-auto"
      >
        Me prévenir à l&apos;ouverture
      </button>
    </div>
  );
}
