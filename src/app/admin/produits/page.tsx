import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { formatPrice } from "@/lib/products";
import { isAdmin } from "@/server/admin-auth";
import { getAllProducts, MAX_SCENES } from "@/server/catalog";
import { AdminHeader, Banner } from "../AdminHeader";
import { setProductActiveAction, updateSceneAction } from "../content-actions";
import { ProductForm } from "../ProductForm";
import { btn, input, label, sectionTitle } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration — Pièces",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function ProductsAdminPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect("/admin");
  const params = await searchParams;
  const products = await getAllProducts();

  return (
    <PageShell wide>
      <AdminHeader title="Pièces" current="produits" />
      <Banner notice={one(params.notice)} error={one(params.error)} field={one(params.field)} />
      <p className="mt-6 text-xs text-muted">
        Les pièces ne sont jamais supprimées (les commandes y font référence) : archivez-les pour les
        retirer de l&apos;exposition. Le stock se gère depuis le tableau de bord.
      </p>

      <details className="mt-8 border border-border bg-white/60 p-5">
        <summary className={`cursor-pointer ${sectionTitle}`}>Nouvelle pièce</summary>
        <div className="mt-5">
          <ProductForm />
        </div>
      </details>

      <h2 className={`mt-12 ${sectionTitle}`}>Catalogue ({products.length})</h2>
      <div className="mt-4 space-y-4">
        {products.map((product) => (
          <details
            key={product.slug}
            id={`p-${product.slug}`}
            className={`border border-border bg-white/60 p-5 ${product.active ? "" : "opacity-70"}`}
          >
            <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2">
              <span className="font-serif text-xl">
                {product.name}
                {!product.active && <span className="text-sm text-muted"> (archivée)</span>}
              </span>
              <span className="text-xs text-brown-soft">
                {formatPrice(product.price)} · {product.sizes.join(" ")} · ordre {product.position}
              </span>
            </summary>

            <div className="mt-5 space-y-6">
              <ProductForm product={product} />

              <div className="grid gap-6 border-t border-border pt-5 sm:grid-cols-2">
                <div>
                  <p className={label}>Photo</p>
                  {product.image ? (
                    <div className="relative mt-2 h-40 w-32 border border-border bg-white">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="128px"
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Aucune : l&apos;illustration est utilisée.</p>
                  )}
                  <form
                    action="/admin/media"
                    method="post"
                    encType="multipart/form-data"
                    className="mt-3 flex flex-wrap items-center gap-3"
                  >
                    <input type="hidden" name="target" value="product" />
                    <input type="hidden" name="slug" value={product.slug} />
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
                  <p className="mt-2 text-xs text-muted">PNG, JPEG ou WebP, 3 Mo maximum, fond transparent conseillé. Stockée sur S3, servie par CloudFront.</p>
                  {product.image && (
                    <form action="/admin/media" method="post" encType="multipart/form-data" className="mt-3">
                      <input type="hidden" name="target" value="product" />
                      <input type="hidden" name="slug" value={product.slug} />
                      <input type="hidden" name="operation" value="remove" />
                      <button type="submit" className={btn}>
                        Retirer la photo
                      </button>
                    </form>
                  )}
                </div>

                <div>
                  <p className={label}>Visibilité</p>
                  <form action={setProductActiveAction} className="mt-3">
                    <input type="hidden" name="slug" value={product.slug} />
                    <input type="hidden" name="active" value={product.active ? "no" : "yes"} />
                    <button type="submit" className={btn}>
                      {product.active ? "Archiver (retirer de l'exposition)" : "Restaurer"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <p className={label}>
                  Looks ({product.scenes?.length ?? 0}/{MAX_SCENES}) — photos portées, par lieu ou ambiance
                </p>
                <p className="mt-1 text-xs text-muted">
                  Ouverts depuis la pièce (clic sur la pièce ou « Voir les looks »). Format conseillé : paysage
                  3:2, sujet centré. Voir docs/prompts-images.md.
                </p>

                <ul className="mt-4 space-y-4">
                  {(product.scenes ?? []).map((scene) => (
                    <li
                      key={scene.id}
                      className="grid gap-4 border border-border bg-white p-3 sm:grid-cols-[9rem_1fr_auto]"
                    >
                      <div className="relative h-24 w-36 bg-cream">
                        <Image
                          src={scene.image}
                          alt={scene.title}
                          fill
                          sizes="144px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <form action={updateSceneAction} className="grid gap-2">
                        <input type="hidden" name="slug" value={product.slug} />
                        <input type="hidden" name="sceneId" value={scene.id} />
                        <input
                          name="title"
                          defaultValue={scene.title}
                          required
                          minLength={2}
                          maxLength={60}
                          aria-label="Titre du look"
                          className={input}
                        />
                        <input
                          name="caption"
                          defaultValue={scene.caption}
                          maxLength={200}
                          aria-label="Légende du look"
                          placeholder="Légende (optionnelle)"
                          className={input}
                        />
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs text-muted">
                            Ordre
                            <input
                              name="position"
                              type="number"
                              min={0}
                              defaultValue={scene.position}
                              className={`${input} w-20`}
                            />
                          </label>
                          <button type="submit" className={btn}>
                            Enregistrer
                          </button>
                        </div>
                      </form>
                      <form action="/admin/media" method="post" encType="multipart/form-data">
                        <input type="hidden" name="target" value="scene" />
                        <input type="hidden" name="slug" value={product.slug} />
                        <input type="hidden" name="operation" value="remove" />
                        <input type="hidden" name="sceneId" value={scene.id} />
                        <button type="submit" className={btn}>
                          Retirer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>

                {(product.scenes?.length ?? 0) < MAX_SCENES && (
                  <form
                    action="/admin/media"
                    method="post"
                    encType="multipart/form-data"
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    <input type="hidden" name="target" value="scene" />
                    <input type="hidden" name="slug" value={product.slug} />
                    <input type="hidden" name="operation" value="add" />
                    <input
                      name="title"
                      required
                      minLength={2}
                      maxLength={60}
                      placeholder="Titre : lieu ou ambiance (ex. Plateau, heure dorée)"
                      aria-label="Titre du nouveau look"
                      className={input}
                    />
                    <input
                      name="caption"
                      maxLength={200}
                      placeholder="Légende (optionnelle)"
                      aria-label="Légende du nouveau look"
                      className={input}
                    />
                    <input
                      type="file"
                      name="file"
                      accept="image/png,image/jpeg,image/webp"
                      required
                      className={input}
                    />
                    <button type="submit" className={`${btn} sm:justify-self-start`}>
                      Ajouter le look
                    </button>
                  </form>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>
    </PageShell>
  );
}
