import { garmentKinds } from "@/lib/products";
import type { CatalogProduct } from "@/server/catalog";
import { saveProductAction } from "./content-actions";
import { btn, input, label } from "./ui";

const KIND_LABELS: Record<string, string> = {
  "hoodie-cropped": "Hoodie cropped",
  "hoodie-oversized": "Hoodie oversized",
  tee: "T-shirt",
  crewneck: "Crewneck",
  pants: "Pantalon",
  cap: "Casquette",
};

const BLANK = {
  kind: "tee",
  tone: { bg: "#24150F", ink: "#F3EBDD", fill: "#F3EBDD", line: "#24150F", accent: "#A9844F" },
};

function Field({ name, title, children }: { name: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className={label}>
        {title}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Formulaire de création (sans `product`) ou de modification d'une pièce. */
export function ProductForm({ product }: { product?: CatalogProduct }) {
  const id = product?.slug ?? "new";
  const tone = product?.tone ?? BLANK.tone;
  const color = (name: "bg" | "ink" | "fill" | "line", title: string) => (
    <div>
      <label htmlFor={`${id}-${name}`} className={label}>
        {title}
      </label>
      <input
        id={`${id}-${name}`}
        name={name}
        type="color"
        defaultValue={tone[name]}
        className="mt-1 h-9 w-full cursor-pointer border border-border bg-white"
      />
    </div>
  );

  return (
    <form action={saveProductAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="mode" value={product ? "edit" : "create"} />
      {product && <input type="hidden" name="slug" value={product.slug} />}

      <Field name={`${id}-name`} title="Nom">
        <input id={`${id}-name`} name="name" required maxLength={80} defaultValue={product?.name} className={input} />
      </Field>
      <Field name={`${id}-word`} title="Mot géant (fond de scène)">
        <input id={`${id}-word`} name="word" required maxLength={24} defaultValue={product?.word} className={input} />
      </Field>
      <Field name={`${id}-silhouette`} title="Silhouette (ex. Hoodie)">
        <input
          id={`${id}-silhouette`}
          name="silhouette"
          required
          maxLength={40}
          defaultValue={product?.silhouette}
          className={input}
        />
      </Field>
      <Field name={`${id}-price`} title="Prix TTC (€, entier)">
        <input
          id={`${id}-price`}
          name="price"
          type="number"
          min={0}
          max={10000}
          step={1}
          required
          defaultValue={product?.price}
          className={input}
        />
      </Field>
      <Field name={`${id}-edition`} title="Édition (ex. « 80 pièces » ou « Permanente »)">
        <input
          id={`${id}-edition`}
          name="edition"
          required
          maxLength={40}
          defaultValue={product?.edition ?? "Permanente"}
          className={input}
        />
      </Field>
      <Field name={`${id}-fabric`} title="Matière">
        <input id={`${id}-fabric`} name="fabric" maxLength={80} defaultValue={product?.fabric} className={input} />
      </Field>
      <Field name={`${id}-sizes`} title="Tailles (séparées par des virgules)">
        <input
          id={`${id}-sizes`}
          name="sizes"
          required
          maxLength={160}
          defaultValue={product?.sizes.join(", ") ?? "XS, S, M, L, XL"}
          className={input}
        />
      </Field>
      <Field
        name={`${id}-stockPerSize`}
        title={product ? "Taille de l'édition (par taille)" : "Stock initial (par taille)"}
      >
        <input
          id={`${id}-stockPerSize`}
          name="stockPerSize"
          type="number"
          min={0}
          max={10000}
          step={1}
          required
          defaultValue={product?.stockPerSize ?? 10}
          className={input}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field name={`${id}-description`} title="Description">
          <textarea
            id={`${id}-description`}
            name="description"
            rows={3}
            maxLength={600}
            defaultValue={product?.description}
            className={input}
          />
        </Field>
      </div>

      <Field name={`${id}-kind`} title="Illustration (si pas de photo)">
        <select id={`${id}-kind`} name="kind" defaultValue={product?.kind ?? BLANK.kind} className={input}>
          {garmentKinds.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind] ?? kind}
            </option>
          ))}
        </select>
      </Field>
      <Field name={`${id}-position`} title="Ordre d'affichage (plus petit = avant)">
        <input
          id={`${id}-position`}
          name="position"
          type="number"
          min={0}
          max={100000}
          step={1}
          defaultValue={product?.position}
          placeholder="à la fin"
          className={input}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-5">
        {color("bg", "Fond")}
        {color("ink", "Texte")}
        {color("fill", "Pièce")}
        {color("line", "Traits")}
        <div>
          <label htmlFor={`${id}-accent`} className={label}>
            Accent
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id={`${id}-accent`}
              name="accent"
              type="color"
              defaultValue={tone.accent ?? BLANK.tone.accent}
              className="h-9 w-full cursor-pointer border border-border bg-white"
            />
            <input
              type="checkbox"
              name="useAccent"
              value="yes"
              defaultChecked={Boolean(tone.accent)}
              aria-label="Utiliser l'accent"
            />
          </div>
        </div>
      </div>

      <div className="sm:col-span-2">
        <button type="submit" className={btn}>
          {product ? "Enregistrer" : "Créer la pièce"}
        </button>
      </div>
    </form>
  );
}
