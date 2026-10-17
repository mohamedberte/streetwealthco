import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/lib/brand";
import { getPage, getPages } from "@/server/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return { title: page?.title ?? "Informations" };
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const [page, pages] = await Promise.all([getPage(slug), getPages()]);
  if (!page) notFound();

  return (
    <PageShell wide>
      <div className="grid gap-10 md:grid-cols-[13rem_1fr] md:gap-16">
        <nav aria-label="Informations" className="md:sticky md:top-4 md:self-start">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted">Informations</p>
          <ul className="mt-4 flex gap-x-6 gap-y-2 overflow-x-auto pb-2 md:flex-col md:gap-y-1 md:overflow-visible md:pb-0">
            {pages.map((item) => (
              <li key={item.slug} className="shrink-0">
                <Link
                  href={`/infos/${item.slug}`}
                  aria-current={item.slug === page.slug ? "page" : undefined}
                  className={`block whitespace-nowrap py-1.5 text-sm transition-colors md:whitespace-normal ${
                    item.slug === page.slug
                      ? "text-brown underline decoration-gold decoration-1 underline-offset-8"
                      : "text-brown-soft hover:text-brown"
                  }`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-2xl">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{page.title}</h1>
          {page.intro && (
            <p className="mt-6 border-l border-gold pl-4 text-sm leading-relaxed text-brown-soft">
              {page.intro}
            </p>
          )}
          <div className="mt-12 space-y-10">
            {page.sections.map((section, index) => (
              <section key={`${index}-${section.heading}`}>
                {section.heading && (
                  <h2 className="border-b border-border pb-2 text-[11px] uppercase tracking-[0.26em] text-gold">
                    {section.heading}
                  </h2>
                )}
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-brown-soft">
                  {section.body.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-14 border-t border-border pt-6 text-sm text-brown-soft">
            Une question ?{" "}
            <a
              href={`mailto:${brand.email}`}
              className="text-brown underline decoration-gold underline-offset-4"
            >
              {brand.email}
            </a>
          </p>
        </article>
      </div>
    </PageShell>
  );
}
