"use client";

import { useActionState } from "react";
import { requestBoutiqueAccess } from "@/app/acces/actions";

const initial = { error: "" };

export function AccessForm() {
  const [state, action, pending] = useActionState(requestBoutiqueAccess, initial);

  return (
    <form action={action} className="space-y-8">
      <label className="block">
        <span className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-muted">
          Code d&apos;accès
        </span>
        <input
          name="code"
          type="password"
          autoComplete="off"
          required
          className="w-full border-0 border-b border-border bg-transparent py-3 font-serif text-3xl text-brown outline-none transition-colors focus:border-brand"
        />
      </label>
      {state.error ? (
        <p className="text-sm leading-6 text-brown-soft">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-ivory transition-colors hover:bg-brand/88 disabled:opacity-60"
      >
        {pending ? "Vérification…" : "Entrer"}
      </button>
    </form>
  );
}
