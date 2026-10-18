import { card } from "./ui";

const NOTICES: Record<string, string> = {
  saved: "Enregistré.",
  created: "Créé.",
  reset: "Texte d'origine restauré.",
  image_saved: "Image enregistrée.",
  image_removed: "Image retirée.",
  scene_added: "Look ajouté.",
  scene_removed: "Look retiré.",
  invoice: "Facture émise.",
  credit_note: "Avoir émis et envoyé au client.",
  billing_saved: "Informations société et facturation enregistrées.",
  refund_failed:
    "Le remboursement a échoué chez Stripe. Rien n'a été modifié : vérifiez le paiement dans le tableau de bord Stripe puis réessayez.",
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
  tracking: "Numéro de suivi invalide : 6 à 40 lettres, chiffres ou tirets, sans espace.",
  company:
    "Facture non émise : les informations de la société sont incomplètes. Complétez la page Société et factures, puis réessayez.",
  invoice: "La facture n'a pas pu être émise. Vérifiez que la migration documents a bien été exécutée, puis réessayez.",
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
  email: "Adresse e-mail",
  vatMode: "Régime de TVA",
  legalName: "Raison sociale",
  legalForm: "Forme juridique",
  shareCapital: "Capital social",
  siret: "SIRET",
  rcs: "Ville du RCS",
  vatNumber: "N° de TVA intracommunautaire",
  address: "Adresse",
  postalCode: "Code postal",
  city: "Ville",
  country: "Pays",
  phone: "Téléphone",
  publisher: "Directeur de la publication",
  returnAddress: "Adresse de retour",
  mediator: "Médiateur de la consommation",
  host: "Hébergeur",
  footer: "Mentions en pied de facture",
};

/** Titre de page d'administration, avec une phrase d'aide facultative. */
export function AdminTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <header>
      <h1 className="font-serif text-4xl sm:text-5xl">{title}</h1>
      {lead && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brown-soft">{lead}</p>}
    </header>
  );
}

export function Banner({ notice, error, field }: { notice?: string; error?: string; field?: string }) {
  const message = notice
    ? NOTICES[notice]
    : error === "invalid"
      ? `Valeur invalide : ${FIELDS[field ?? ""] ?? "formulaire"}.`
      : error
        ? ERRORS[error]
        : undefined;
  if (!message) return null;
  const bad = Boolean(error) || notice === "refund_failed";
  return (
    <p
      role={bad ? "alert" : "status"}
      className={`mt-6 border-l-2 px-4 py-3 text-sm ${card} ${bad ? "border-l-gold" : "border-l-brown"}`}
    >
      {message}
    </p>
  );
}
