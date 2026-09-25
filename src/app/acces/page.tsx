import type { Metadata } from "next";
import Image from "next/image";
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
    <div className="overflow-x-clip">
      <section data-parallax-root className="relative isolate min-h-[54svh] overflow-hidden border-b border-border/70">
        <div className="absolute inset-0">
          <Image
            src="/visuals/rework-chapter-c.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            data-zoom="1.08"
            className="sw-cinematic-media object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(162deg,rgba(22,18,15,0.24)_8%,rgba(22,18,15,0.72)_88%)]" />

        <div className="relative mx-auto flex min-h-[54svh] max-w-[86rem] items-end px-4 pb-12 pt-20 sm:px-6 sm:pb-16">
          <div data-reveal className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-ivory/84">
              Accès boutique
            </p>
            <h1 className="mt-4 font-serif text-4xl text-ivory sm:text-5xl">
              La boutique s&apos;ouvre sur code.
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-ivory/84">
              Le code permet d&apos;accéder aux capsules limitées du moment.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex min-h-[46vh] max-w-[46rem] flex-col justify-center px-4 py-14 sm:px-6 sm:py-20">
        <div data-reveal data-drift className="sw-panel p-8 sm:p-10">
          <p className="mb-10 max-w-xl leading-7 text-muted">
            Sans code, les pièces restent visibles uniquement en aperçu public.
          </p>
          <AccessForm />
        </div>
      </div>
      </section>
    </div>
  );
}
