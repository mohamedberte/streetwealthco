import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-16 px-6 py-20 md:grid-cols-2">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
          Contact
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-brown">
          Écrire à l&apos;atelier.
        </h1>
        <p className="mt-6 max-w-sm text-lg leading-8 text-brown-soft">
          Invitations, presse, collaborations. Un mot suffit. Nous lisons
          tout, nous répondons peu, et toujours avec soin.
        </p>
        <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-muted">
          {brand.email}
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
