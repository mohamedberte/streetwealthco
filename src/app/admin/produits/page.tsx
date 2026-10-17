import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { isAdmin } from "@/server/admin-auth";
import { getAllProducts, MAX_SCENES } from "@/server/catalog";
import { inventoryRows } from "@/server/orders";
import { waitlistEntries } from "@/server/waitlist";
import { notifyWaitlistAction, removeWaitlistAction, updateStock } from "../actions";
import { AdminTitle, Banner } from "../AdminHeader";
import { setProductActiveAction, updateSceneAction } from "../content-actions";
import { ProductForm } from "../ProductForm";
import { btn, btnPrimary, card, input, label, sectionTitle } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration — Pièces et stock",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const dateFr = (value: Date | string) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function ProductsAdminPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect("/admin");
  const params = await searchParams;
  const [products, inventory, waiting] = await Promise.all([
    getAllProducts(),
    inventoryRows(),
    waitlistEntries(),
  ]);

  const stockOf = (slug: string, size: string) =>
    inventory.find((row) => row.slug === slug && row.size === size);
  const available = (slug: string, size: string) => {
    const row = stockOf(slug, size);
    return row ? Math.max(row.stock - row.reserved, 0) : 0;
  };
  const waitingFor = (slug: string, size: string) =>
    waiting.filter((entry) => entry.slug === slug && entry.size === size && !entry.notified_at).length;

  const waitingGroups = new Map<string, typeof waiting>();
  for (const entry of waiting) {
    const key = `${entry.slug}:${entry.size}`;
    waitingGroups.set(key, [...(waitingGroups.get(key) ?? []), entry]);
  }

  return (
    <>
      <AdminTitle
        title="Pièces et stock"
        lead="Chaque pièce regroupe son stock par taille, ses informations, ses photos et ses looks. Une pièce n'est jamais supprimée (les commandes y font référence) : archivez-la pour la retirer de l'exposition."
      />
      <Banner notice={one(params.notice)} error={one(params.error)} field={one(params.field)} />

      <details className={`mt-8 p-5 ${card}`}>
        <summary className={`cursor-pointer ${sectionTitle}`}>+ Nouvelle pièce</summary>
        <div className="mt-5">
          <ProductForm />
        </div>
      </details>

      <div className="mt-8 space-y-6">
        {products.map((product) => (
          <article
            key={product.slug}
            id={`p-${product.slug}`}
            className={`p-5 sm:p-6 ${card} ${product.active ? "" : "opacity-70"}`}
          >
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-serif text-2xl">{product.name}</h2>
              <p className="text-sm text-brown-soft">
                {formatPrice(product.price)} · {product.edition}
                {!product.active && " · archivée"}
              </p>
            </header>

            <p className={`mt-5 ${label}`}>
              Stock par taille <span className="normal-case tracking-normal">(enregistrer prévient la liste d&apos;attente)</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.sizes.map((size) => {
                const row = stockOf(product.slug, size);
                const wait = waitingFor(product.slug, size);
                const left = available(product.slug, size);
                return (
                  <form
                    key={size}
                    action={updateStock}
                    className="flex items-center gap-2 border border-border bg-white p-2"
                  >
                    <input type="hidden" name="slug" value={product.slug} />
                    <input type="hidden" name="size" value={size} />
                    <span className="w-9 text-xs uppercase tracking-[0.14em]">{size}</span>
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      defaultValue={row?.stock ?? 0}
                      aria-label={`Stock ${size}`}
                      className={`${input} w-20`}
                    />
                    <span className={`text-[10px] ${left === 0 ? "text-gold" : "text-muted"}`}>
                      {left === 0 ? "épuisé" : `${left} dispo`}
                      {(row?.reserved ?? 0) > 0 ? ` · ${row?.reserved} rés.` : ""}
                      {wait > 0 ? ` · ${wait} en attente` : ""}
                    </span>
                    <button type="submit" className={btn}>
                      OK
                    </button>
                  </form>
                );
              })}
            </div>

            <details className="mt-6 border-t border-border pt-4">
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-muted hover:text-brown">
                Modifier la pièce, photos et looks
              </summary>

              <div className="mt-5 space-y-6">
                <ProductForm product={product} />

                <div className="grid gap-6 border-t border-border pt-5 sm:grid-cols-2">
                  <div>
                    <p className={label}>Photo de la pièce</p>
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
                    <p className="mt-2 text-xs text-muted">
                      PNG, JPEG ou WebP, 3 Mo maximum, fond transparent conseillé.
                    </p>
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
                      <button type="submit" className={product.active ? btn : btnPrimary}>
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
                    Ouverts depuis la pièce sur le site. Format conseillé : paysage 3:2, sujet centré (voir
                    docs/prompts-images.md).
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
                      <button type="submit" className={`${btnPrimary} sm:justify-self-start`}>
                        Ajouter le look
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </details>
          </article>
        ))}
      </div>

      <h2 id="attente" className={`mt-16 ${sectionTitle}`}>
        Liste d&apos;attente
      </h2>
      <p className="mt-2 text-xs text-muted">
        Les inscrits sont prévenus par e-mail, dans l&apos;ordre d&apos;inscription, dès que du stock est
        disponible.
      </p>
      {waitingGroups.size === 0 ? (
        <p className={`mt-4 p-5 text-sm text-brown-soft ${card}`}>Personne en attente.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {[...waitingGroups.entries()].map(([key, entries]) => {
            const [slug, size] = key.split(":");
            const product = products.find((p) => p.slug === slug);
            const open = entries.filter((entry) => !entry.notified_at);
            return (
              <details key={key} className={`p-4 ${card}`} open={open.length > 0}>
                <summary className="cursor-pointer text-sm">
                  {product?.name ?? slug} · {size} — {open.length} en attente
                  {entries.length > open.length ? `, ${entries.length - open.length} prévenu(s)` : ""}
                  {` · ${available(slug, size)} dispo`}
                </summary>
                <ul className="mt-3 divide-y divide-border text-sm">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                      <span>
                        {entry.email}{" "}
                        <span className="text-xs text-muted">
                          · inscrit le {dateFr(entry.created_at)}
                          {entry.notified_at ? ` · prévenu le ${dateFr(entry.notified_at)}` : ""}
                        </span>
                      </span>
                      <form action={removeWaitlistAction}>
                        <input type="hidden" name="id" value={entry.id} />
                        <button type="submit" className={btn}>
                          Retirer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
                {open.length > 0 && available(slug, size) > 0 && (
                  <form action={notifyWaitlistAction} className="mt-3">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="size" value={size} />
                    <button type="submit" className={btnPrimary}>
                      Prévenir maintenant
                    </button>
                  </form>
                )}
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
