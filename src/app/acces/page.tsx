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
    <div className="mx-auto flex min-h-[72vh] max-w-2xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
      <div data-reveal data-drift className="sw-panel p-8 sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-brand">
          Accès boutique
        </p>
        <h1 className="mt-4 font-serif text-4xl text-brown sm:text-5xl">
          La boutique s&apos;ouvre sur code.
        </h1>
        <p className="mb-10 mt-4 max-w-xl leading-7 text-muted">
          Le code permet d&apos;accéder aux capsules limitées du moment. Sans
          lui, les pièces restent visibles uniquement en aperçu public.
        </p>
        <AccessForm />
      </div>
    </div>
  );
}
