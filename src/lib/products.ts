export type GarmentKind =
  | "hoodie-cropped"
  | "hoodie-oversized"
  | "tee"
  | "crewneck"
  | "pants"
  | "cap";

/** Silhouettes disponibles pour l'illustration vectorielle. */
export const garmentKinds: GarmentKind[] = [
  "hoodie-cropped",
  "hoodie-oversized",
  "tee",
  "crewneck",
  "pants",
  "cap",
];

export type Tone = {
  /** Fond de la scène */
  bg: string;
  /** Couleur du texte et des filets */
  ink: string;
  /** Couleur de la pièce (illustration) */
  fill: string;
  /** Traits de l'illustration */
  line: string;
  /** Accent optionnel (broderie) */
  accent?: string;
};

export type Product = {
  slug: string;
  name: string;
  /** Mot géant affiché en fond de scène */
  word: string;
  silhouette: string;
  price: number;
  description: string;
  fabric: string;
  edition: string;
  sizes: string[];
  /** Stock initial par taille (sert aussi à calculer la taille de l'édition). */
  stockPerSize: number;
  kind: GarmentKind;
  tone: Tone;
  /**
   * Photo réelle (optionnelle), ex: "/pieces/hoodie-cropped.png".
   * Si absente, l'illustration vectorielle est utilisée.
   */
  image?: string;
  /**
   * Scènes (looks) : photos de la pièce portée dans différents lieux, gérées dans l'admin.
   * Affichées dans la vue « Looks » ouverte depuis la pièce.
   */
  scenes?: ProductScene[];
};

export type ProductScene = {
  id: number;
  /** Ordre d'affichage (croissant). */
  position: number;
  /** Lieu ou ambiance, ex. « Plateau, heure dorée ». */
  title: string;
  caption: string;
  /** URL CloudFront de la photo. */
  image: string;
};

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL"];

export const products: Product[] = [
  {
    slug: "hoodie-cropped-ivoire",
    name: "Hoodie Cropped Ivoire",
    word: "CROPPED",
    silhouette: "Hoodie",
    price: 189,
    description:
      "Une coupe courte, précise, pensée pour l'allure. Molleton lourd, capuche profonde, signature brodée ton sur ton.",
    fabric: "Molleton coton 480 g/m²",
    edition: "80 pièces",
    sizes: STANDARD_SIZES,
    stockPerSize: 16,
    kind: "hoodie-cropped",
    tone: { bg: "#24150F", ink: "#F3EBDD", fill: "#F3EBDD", line: "#24150F" },
  },
  {
    slug: "hoodie-oversized-creme",
    name: "Hoodie Oversized Crème",
    word: "OVERSIZED",
    silhouette: "Hoodie",
    price: 210,
    description:
      "Le volume ample, sans relâchement. Épaules tombantes, poche kangourou, la pièce maîtresse de la garde-robe.",
    fabric: "Molleton coton 520 g/m²",
    edition: "60 pièces",
    sizes: STANDARD_SIZES,
    stockPerSize: 12,
    kind: "hoodie-oversized",
    tone: { bg: "#5C493D", ink: "#F3EBDD", fill: "#E8D8C0", line: "#5C493D" },
  },
  {
    slug: "tee-essentiel-brun",
    name: "Tee Essentiel Brun",
    word: "ESSENTIEL",
    silhouette: "T-shirt",
    price: 85,
    description:
      "Un jersey dense, une teinte brune tirée de la maison. Discret, exact, destiné à durer.",
    fabric: "Jersey coton 220 g/m²",
    edition: "Permanente",
    sizes: STANDARD_SIZES,
    stockPerSize: 40,
    kind: "tee",
    tone: { bg: "#E8D8C0", ink: "#24150F", fill: "#5C493D", line: "#24150F" },
  },
  {
    slug: "sweat-col-rond-ivoire",
    name: "Sweat Col Rond Ivoire",
    word: "COL ROND",
    silhouette: "Crewneck",
    price: 145,
    description:
      "La sobriété d'un col rond, la densité d'un molleton premium. Ni logo ostentatoire, ni concession.",
    fabric: "Molleton coton 460 g/m²",
    edition: "70 pièces",
    sizes: STANDARD_SIZES,
    stockPerSize: 14,
    kind: "crewneck",
    tone: { bg: "#CDBB9F", ink: "#24150F", fill: "#F3EBDD", line: "#24150F" },
  },
  {
    slug: "pantalon-relaxed",
    name: "Pantalon Relaxed",
    word: "RELAXED",
    silhouette: "Pantalon",
    price: 165,
    description:
      "Une ligne relâchée, une matière souple. Le contrepoint exact des hauts structurés.",
    fabric: "Coton sergé 320 g/m²",
    edition: "50 pièces",
    sizes: STANDARD_SIZES,
    stockPerSize: 10,
    kind: "pants",
    tone: { bg: "#F3EBDD", ink: "#24150F", fill: "#24150F", line: "#CDBB9F" },
  },
  {
    slug: "casquette-signature",
    name: "Casquette Signature",
    word: "SIGNATURE",
    silhouette: "Casquette",
    price: 55,
    description:
      "Six panneaux, visière franche, broderie compacte. Un accessoire de présence, pas d'effet.",
    fabric: "Coton twill",
    edition: "Permanente",
    sizes: ["Unique"],
    stockPerSize: 60,
    kind: "cap",
    tone: {
      bg: "#1A0F0A",
      ink: "#E8D8C0",
      fill: "#E8D8C0",
      line: "#1A0F0A",
      accent: "#A9844F",
    },
  },
];

/** Édition limitée = toute pièce dont l'édition n'est pas « Permanente ». */
export function isLimited(product: Product) {
  return product.edition !== "Permanente";
}

export function editionTotal(product: Product) {
  return product.stockPerSize * product.sizes.length;
}

/** Arrondit un montant en euros au centime (évite 89.97000000000001 après une somme). */
export const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

/** Montant en centimes entiers, pour la facturation et Stripe. */
export const toCents = (amount: number) => Math.round(amount * 100);

/** Montants en euros (TTC) : « 189 € » pour un prix rond, « 29,99 € » sinon. */
export function formatPrice(amount: number) {
  const value = roundMoney(amount);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
