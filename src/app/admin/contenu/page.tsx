import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/server/admin-auth";
import { getAllPages, getSettings, serializeContent } from "@/server/content";
import { AdminTitle, Banner } from "../AdminHeader";
import { resetPageAction, savePageAction, saveSettingsAction } from "../content-actions";
import { btn, btnPrimary, card, input, label, sectionTitle } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration — Contenu",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function ContentAdminPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect("/admin");
  const params = await searchParams;
  const [pages, settings] = await Promise.all([getAllPages(), getSettings()]);

  return (
    <>
      <AdminTitle
        title="Contenu du site"
        lead="Logo, accroche et pages d'information (CGV, retours, mentions…). Les photos des pièces et les looks se gèrent dans « Pièces et stock »."
      />
      <Banner notice={one(params.notice)} error={one(params.error)} field={one(params.field)} />

      <h2 className={`mt-10 ${sectionTitle}`}>Logo et accroche</h2>
      <div className={`mt-4 grid gap-6 p-5 sm:grid-cols-2 ${card}`}>
        <div>
          <p className={label}>Logo</p>
          {settings.logoUrl ? (
            <div className="relative mt-2 h-16 w-48 border border-border bg-brown">
              <Image src={settings.logoUrl} alt="Logo" fill sizes="192px" className="object-contain p-2" unoptimized />
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Aucune image : le logotype TRIPLEX (police Bebas Neue) est utilisé.
            </p>
          )}
          <form
            action="/admin/media"
            method="post"
            encType="multipart/form-data"
            className="mt-3 flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="target" value="logo" />
            <input type="hidden" name="operation" value="upload" />
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp"
              required
              className={`${input} max-w-xs`}
            />
            <button type="submit" className={btn}>
              Envoyer
            </button>
          </form>
          <p className="mt-2 text-xs text-muted">
            PNG, JPEG ou WebP, 3 Mo maximum. Fond transparent et trait clair conseillés (affiché sur fond
            sombre ou clair selon la pièce).
          </p>
          {settings.logoUrl && (
            <form action="/admin/media" method="post" encType="multipart/form-data" className="mt-3">
              <input type="hidden" name="target" value="logo" />
              <input type="hidden" name="operation" value="remove" />
              <button type="submit" className={btn}>
                Revenir au logotype texte
              </button>
            </form>
          )}
        </div>

        <form action={saveSettingsAction} className="space-y-3">
          <label htmlFor="tagline" className={label}>
            Accroche (sous le logo)
          </label>
          <input id="tagline" name="tagline" maxLength={160} defaultValue={settings.tagline} className={input} />
          <p className="text-xs text-muted">Laisser vide pour restaurer l&apos;accroche d&apos;origine.</p>
          <button type="submit" className={btnPrimary}>
            Enregistrer
          </button>
        </form>
      </div>

      <h2 className={`mt-14 ${sectionTitle}`}>Pages d&apos;information</h2>
      <p className="mt-2 text-xs text-muted">
        Format : une ligne <code>## Titre</code> ouvre une section ; les paragraphes sont séparés par une ligne
        vide. Les textes juridiques (CGV, mentions légales, confidentialité, retours) doivent rester validés
        par un juriste.
      </p>

      <details className={`mt-6 p-5 ${card}`}>
        <summary className={`cursor-pointer ${sectionTitle}`}>Nouvelle page</summary>
        <form action={savePageAction} className="mt-5 space-y-4">
          <input type="hidden" name="mode" value="create" />
          <div>
            <label htmlFor="new-title" className={label}>Titre</label>
            <input id="new-title" name="title" required maxLength={100} className={`${input} mt-1`} />
          </div>
          <div>
            <label htmlFor="new-intro" className={label}>Introduction</label>
            <textarea id="new-intro" name="intro" rows={2} maxLength={800} className={`${input} mt-1`} />
          </div>
          <div>
            <label htmlFor="new-content" className={label}>Contenu</label>
            <textarea
              id="new-content"
              name="content"
              rows={10}
              maxLength={20000}
              placeholder={"## Premier titre\n\nUn paragraphe.\n\nUn autre paragraphe."}
              className={`${input} mt-1 font-mono`}
            />
          </div>
          <button type="submit" className={btnPrimary}>Créer la page</button>
        </form>
      </details>

      <div className="mt-6 space-y-4">
        {pages.map((page) => (
          <details
            key={page.slug}
            id={`pg-${page.slug}`}
            className={`p-5 ${card} ${page.active ? "" : "opacity-70"}`}
          >
            <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2">
              <span className="font-serif text-xl">
                {page.title}
                {!page.active && <span className="text-sm text-muted"> (masquée)</span>}
              </span>
              <span className="text-xs text-brown-soft">
                /infos/{page.slug}
                {page.fromDb ? (page.custom ? " · créée" : " · modifiée") : " · texte d'origine"}
              </span>
            </summary>

            <form action={savePageAction} className="mt-5 space-y-4">
              <input type="hidden" name="mode" value="edit" />
              <input type="hidden" name="slug" value={page.slug} />
              <div>
                <label htmlFor={`${page.slug}-title`} className={label}>Titre</label>
                <input
                  id={`${page.slug}-title`}
                  name="title"
                  required
                  maxLength={100}
                  defaultValue={page.title}
                  className={`${input} mt-1`}
                />
              </div>
              <div>
                <label htmlFor={`${page.slug}-intro`} className={label}>Introduction</label>
                <textarea
                  id={`${page.slug}-intro`}
                  name="intro"
                  rows={2}
                  maxLength={800}
                  defaultValue={page.intro ?? ""}
                  className={`${input} mt-1`}
                />
              </div>
              <div>
                <label htmlFor={`${page.slug}-content`} className={label}>Contenu</label>
                <textarea
                  id={`${page.slug}-content`}
                  name="content"
                  rows={16}
                  maxLength={20000}
                  defaultValue={serializeContent(page.sections)}
                  className={`${input} mt-1 font-mono`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <label htmlFor={`${page.slug}-position`} className={label}>Ordre</label>
                  <input
                    id={`${page.slug}-position`}
                    name="position"
                    type="number"
                    min={0}
                    max={100000}
                    defaultValue={page.position}
                    className={`${input} w-24`}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="active" value="yes" defaultChecked={page.active} />
                  Visible dans le menu Informations
                </label>
                <button type="submit" className={btnPrimary}>Enregistrer</button>
                <Link href={`/infos/${page.slug}`} className="text-[11px] uppercase tracking-[0.2em] hover:text-gold">
                  Voir la page →
                </Link>
              </div>
            </form>

            {page.fromDb && (
              <form action={resetPageAction} className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
                <input type="hidden" name="slug" value={page.slug} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirm" value="yes" required />
                  {page.custom ? "Je confirme la suppression de cette page" : "Je confirme le retour au texte d'origine"}
                </label>
                <button type="submit" className={btn}>
                  {page.custom ? "Supprimer la page" : "Restaurer le texte d'origine"}
                </button>
              </form>
            )}
          </details>
        ))}
      </div>
    </>
  );
}
