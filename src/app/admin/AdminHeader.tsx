import Link from "next/link";
import { logout } from "./actions";
import { btn } from "./ui";

/** En-tête commun des sous-pages d'administration. */
export function AdminHeader({ title, current }: { title: string; current: "produits" | "contenu" }) {
  const link = (active: boolean) =>
    `hover:text-gold ${active ? "text-gold" : ""}`;
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-4xl sm:text-5xl">{title}</h1>
        <form action={logout}>
          <button type="submit" className={btn}>
            Quitter
          </button>
        </form>
      </div>
      <nav
        aria-label="Sections"
        className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.22em]"
      >
        <Link href="/admin" className="hover:text-gold">
          ← Tableau de bord
        </Link>
        <Link href="/admin/produits" className={link(current === "produits")}>
          Pièces
        </Link>
        <Link href="/admin/contenu" className={link(current === "contenu")}>
          Contenu du site
        </Link>
      </nav>
    </>
  );
}

const NOTICES: Record<string, string> = {
  saved: "Enregistré.",
  created: "Créé.",
  reset: "Texte d'origine restauré.",
  image_saved: "Image enregistrée.",
  image_removed: "Image retirée.",
  scene_added: "Look ajouté.",
  scene_removed: "Look retiré.",
};

const ERRORS: Record<string, string> = {
  image_missing: "Aucun fichier sélectionné.",
  image_size: "Image trop lourde (3 Mo maximum).",
  image_type: "Format non accepté : PNG, JPEG ou WebP uniquement.",
  scene_text: "Titre du look : 2 à 60 caractères ; légende : 200 maximum.",
  scene_limit: "Nombre maximal de looks atteint pour cette pièce (8). Retirez-en un d'abord.",
  image_storage:
    "Stockage d'images indisponible : vérifier la configuration S3 / CloudFront (variables S3_* et CLOUDFRONT_URL) et les droits du compte AWS.",
  unknown: "Élément introuvable.",
};

const FIELDS: Record<string, string> = {
  name: "Nom",
  word: "Mot géant",
  silhouette: "Silhouette",
  price: "Prix",
  description: "Description",
  fabric: "Matière",
  edition: "Édition",
  sizes: "Tailles",
  stockPerSize: "Stock par taille",
  kind: "Illustration",
  bg: "Couleur de fond",
  ink: "Couleur du texte",
  fill: "Couleur de la pièce",
  line: "Couleur des traits",
  accent: "Couleur d'accent",
  position: "Ordre",
  title: "Titre",
  caption: "Légende",
  intro: "Introduction",
  content: "Contenu",
  tagline: "Accroche",
};

export function Banner({ notice, error, field }: { notice?: string; error?: string; field?: string }) {
  const message = notice
    ? NOTICES[notice]
    : error === "invalid"
      ? `Valeur invalide : ${FIELDS[field ?? ""] ?? "formulaire"}.`
      : error
        ? ERRORS[error]
        : undefined;
  if (!message) return null;
  return (
    <p role={error ? "alert" : "status"} className="mt-6 border border-gold bg-white/60 p-4 text-sm">
      {message}
    </p>
  );
}
