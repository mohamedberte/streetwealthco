import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getLegalPage, legalPages } from "@/lib/legal";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getLegalPage(slug);
  return { title: page?.title ?? "Informations" };
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) notFound();

  return (
    <PageShell>
      <h1 className="font-serif text-4xl leading-tight sm:text-6xl">{page.title}</h1>
      {page.intro && <p className="mt-6 text-sm leading-relaxed text-brown-soft">{page.intro}</p>}
      <div className="mt-12 space-y-10">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[11px] uppercase tracking-[0.26em] text-gold">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-brown-soft">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
