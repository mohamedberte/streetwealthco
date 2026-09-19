export type Product = {
  slug: string;
  name: string;
  silhouette: string;
  price: number;
  description: string;
  details: string[];
  fabric: string;
  edition: string;
};

export const products: Product[] = [
  {
    slug: "hoodie-cropped-ivoire",
    name: "Hoodie Cropped Ivoire",
    silhouette: "Cropped hoodie",
    price: 189,
    description:
      "Une coupe courte, précise, pensée pour l'allure. Molleton lourd, col capuche profond, signature brodée au centre.",
    details: [
      "Coupe cropped, tombé structuré",
      "Capuche doublée, cordons teints dans la masse",
      "Broderie StreetWealth Co. ton sur ton brun",
    ],
    fabric: "Molleton coton 480 g/m²",
    edition: "Édition atelier — 80 pièces",
  },
  {
    slug: "hoodie-oversized-creme",
    name: "Hoodie Oversized Crème",
    silhouette: "Oversized hoodie",
    price: 210,
    description:
      "Le volume ample, sans relâchement. Épaules tombantes, manches longues, la pièce maîtresse de la garde-robe.",
    details: [
      "Coupe oversized, emmanchures basses",
      "Poche kangourou invisible",
      "Ourlet et poignets côtes 2x2",
    ],
    fabric: "Molleton coton 520 g/m²",
    edition: "Édition atelier — 60 pièces",
  },
  {
    slug: "tee-essentiel-brun",
    name: "Tee Essentiel Brun",
    silhouette: "T-shirt",
    price: 85,
    description:
      "Un jersey dense, une teinte brune tirée du logo. Discret, exact, destiné à durer.",
    details: [
      "Coupe droite, col rond côtelé",
      "Ourlet double piqûre",
      "Marquage intérieur tissé",
    ],
    fabric: "Jersey coton 220 g/m²",
    edition: "Capsule permanente",
  },
  {
    slug: "sweat-col-rond-ivoire",
    name: "Sweat Col Rond Ivoire",
    silhouette: "Crewneck",
    price: 145,
    description:
      "La sobriété d'un col rond, la densité d'un molleton d'atelier. Ni logo ostentatoire, ni concession.",
    details: [
      "Coupe régulière légèrement allongée",
      "Épaules renforcées",
      "Finition intérieure grattée",
    ],
    fabric: "Molleton coton 460 g/m²",
    edition: "Édition atelier — 70 pièces",
  },
  {
    slug: "pantalon-relaxed",
    name: "Pantalon Relaxed",
    silhouette: "Pantalon",
    price: 165,
    description:
      "Une ligne relâchée, une matière souple. Le contrepoint exact des hauts structurés.",
    details: [
      "Coupe relaxed, pinces légères",
      "Ceinture intérieure",
      "Poches plaquées discrètes",
    ],
    fabric: "Coton sergé 320 g/m²",
    edition: "Édition atelier — 50 pièces",
  },
  {
    slug: "casquette-signature",
    name: "Casquette Signature",
    silhouette: "Casquette",
    price: 55,
    description:
      "Six panneaux, visière franche, broderie compacte. Un accessoire de présence, pas d'effet.",
    details: [
      "Visière préformée",
      "Ajustement métal vieilli",
      "Broderie triangle signature",
    ],
    fabric: "Coton twill",
    edition: "Capsule permanente",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
