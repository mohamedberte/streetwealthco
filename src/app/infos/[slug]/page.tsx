import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getPage } from "@/server/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return { title: page?.title ?? "Informations" };
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <PageShell>
      <h1 className="font-serif text-4xl leading-tight sm:text-6xl">{page.title}</h1>
      {page.intro && <p className="mt-6 text-sm leading-relaxed text-brown-soft">{page.intro}</p>}
      <div className="mt-12 space-y-10">
        {page.sections.map((section, index) => (
          <section key={`${index}-${section.heading}`}>
            {section.heading && (
              <h2 className="text-[11px] uppercase tracking-[0.26em] text-gold">{section.heading}</h2>
            )}
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-brown-soft">
              {section.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
