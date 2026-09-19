"use client";

import { useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="font-serif text-2xl leading-relaxed text-brown">
        Merci. L&apos;atelier vous répondra avec la retenue qui convient.
      </p>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <label className="block">
        <span className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-muted">
          Nom
        </span>
        <input
          name="name"
          required
          className="w-full border-0 border-b border-border bg-transparent py-3 text-brown outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-muted">
          Courriel
        </span>
        <input
          name="email"
          type="email"
          required
          className="w-full border-0 border-b border-border bg-transparent py-3 text-brown outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-muted">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full resize-none border-0 border-b border-border bg-transparent py-3 text-brown outline-none focus:border-gold"
        />
      </label>
      <button
        type="submit"
        className="bg-brown px-8 py-4 text-[11px] uppercase tracking-[0.28em] text-ivory hover:bg-brown-soft"
      >
        Envoyer
      </button>
    </form>
  );
}
