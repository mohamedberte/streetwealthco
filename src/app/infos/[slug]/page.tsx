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
  if (!page) return { title: "Informations", robots: { index: false } };
  const description = page.intro || brand.tagline;
  const path = `/infos/${page.slug}`;
  return {
    title: page.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${page.title} — ${brand.name}`,
      description,
      url: path,
      siteName: brand.name,
      locale: "fr_FR",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: brand.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} — ${brand.name}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const [page, pages] = await Promise.all([getPage(slug), getPages()]);
  if (!page) notFound();

  return (
    <PageShell wide>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-16">
        <nav aria-label="Informations" className="md:sticky md:top-4 md:self-start">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted">Informations</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 md:flex-col md:gap-y-1">
            {pages.map((item) => (
              <li key={item.slug} className="min-w-0">
                <Link
                  href={`/infos/${item.slug}`}
                  aria-current={item.slug === page.slug ? "page" : undefined}
                  className={`block py-1.5 text-sm transition-colors ${
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

        <article className="min-w-0 max-w-2xl break-words">
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
