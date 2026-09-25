import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-[78rem] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr]">
      <div data-reveal data-drift className="sw-panel p-8 sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
          Contact
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-brown sm:text-6xl">
          Parler avec StreetWealth.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-brown-soft">
          Collaborations, presse, projets créatifs. On construit une passerelle
          entre la rue et le chic premium: parlons de ce que vous voulez créer.
        </p>
        <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-muted">
          {brand.email}
        </p>
      </div>

      <div
        data-reveal
        data-reveal-delay="0.12"
        data-drift
        className="sw-panel p-8 sm:p-10"
      >
        <ContactForm />
      </div>
    </div>
  );
}
