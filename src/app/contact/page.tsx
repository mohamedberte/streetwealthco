import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="overflow-x-clip">
      <section data-parallax-root className="relative isolate min-h-[58svh] overflow-hidden border-b border-border/70">
        <div className="absolute inset-0">
          <Image
            src="/visuals/rework-chapter-b.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            data-zoom="1.08"
            className="sw-cinematic-media object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(22,18,15,0.24)_6%,rgba(22,18,15,0.72)_88%)]" />

        <div className="relative mx-auto flex min-h-[58svh] max-w-[86rem] items-end px-4 pb-12 pt-20 sm:px-6 sm:pb-16">
          <div data-reveal className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ivory/84">
              Contact
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ivory sm:text-6xl">
              Parler avec StreetWealth.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-ivory/84">
              Collaborations, presse, projets créatifs. Parlons de ce que vous
              voulez construire.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[86rem] gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr]">
        <div data-reveal data-drift className="sw-panel p-8 sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand">
            Point de contact
          </p>
          <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-muted">
            {brand.email}
          </p>
          <p className="mt-6 text-lg leading-8 text-brown-soft">
            Nous répondons avec attention sur les demandes de collaboration,
            presse et projets créatifs autour du vestiaire StreetWealth.
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
      </section>
    </div>
  );
}
