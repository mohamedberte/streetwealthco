import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccessForm } from "@/components/AccessForm";
import { hasBoutiqueAccess } from "@/lib/access";

export const metadata: Metadata = {
  title: "Accès privé",
};

export default async function AccessPage() {
  if (await hasBoutiqueAccess()) {
    redirect("/boutique");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-20">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
        Cercle privé
      </p>
      <h1 className="mt-4 font-serif text-4xl text-brown">
        La boutique s&apos;ouvre sur code.
      </h1>
      <p className="mt-4 mb-10 leading-7 text-muted">
        Un accès est remis aux proches de la maison. Sans lui, les pièces
        restent en réserve.
      </p>
      <AccessForm />
    </div>
  );
}
