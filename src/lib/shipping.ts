/**
 * Zones de livraison et politique commerciale.
 * Les montants sont en euros (TTC). À ajuster selon l'activité réelle.
 */
export const zones = {
  france: {
    label: "France métropolitaine",
    country: "France",
    fee: 8,
    delay: "3 à 6 jours ouvrés",
  },
  europe: {
    label: "Union européenne",
    country: "Union européenne",
    fee: 18,
    delay: "5 à 10 jours ouvrés",
  },
} as const;

export type ZoneId = keyof typeof zones;
export const zoneIds = Object.keys(zones) as ZoneId[];

/** Pays de la zone « Union européenne » (hors France, qui a sa propre zone). Codes ISO 3166-1 alpha-2. */
export const euCountries = [
  { code: "DE", name: "Allemagne" },
  { code: "AT", name: "Autriche" },
  { code: "BE", name: "Belgique" },
  { code: "BG", name: "Bulgarie" },
  { code: "CY", name: "Chypre" },
  { code: "HR", name: "Croatie" },
  { code: "DK", name: "Danemark" },
  { code: "ES", name: "Espagne" },
  { code: "EE", name: "Estonie" },
  { code: "FI", name: "Finlande" },
  { code: "GR", name: "Grèce" },
  { code: "HU", name: "Hongrie" },
  { code: "IE", name: "Irlande" },
  { code: "IT", name: "Italie" },
  { code: "LV", name: "Lettonie" },
  { code: "LT", name: "Lituanie" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malte" },
  { code: "NL", name: "Pays-Bas" },
  { code: "PL", name: "Pologne" },
  { code: "PT", name: "Portugal" },
  { code: "CZ", name: "Tchéquie" },
  { code: "RO", name: "Roumanie" },
  { code: "SK", name: "Slovaquie" },
  { code: "SI", name: "Slovénie" },
  { code: "SE", name: "Suède" },
] as const;

export const euCountryCodes: string[] = euCountries.map((country) => country.code);

/** Nom français d'un pays livrable (code ISO), ou le code lui-même s'il est inconnu. */
export function countryName(code: string) {
  if (code === "FR") return "France";
  return euCountries.find((country) => country.code === code)?.name ?? code;
}

export const policy = {
  /** Délai de rétractation légal pour les consommateurs, en jours. */
  withdrawalDays: 14,
  /** Quantité maximale par ligne de commande. */
  maxQuantity: 3,
  /** Durée de réservation du stock pendant le paiement, en minutes (30 min minimum pour Stripe). */
  reservationMinutes: 30,
} as const;
