/**
 * TVA des ventes à distance aux consommateurs de l'Union européenne (guichet unique OSS).
 * Les prix du site sont TTC et ne changent pas selon le pays : la facture en extrait la TVA au
 * taux du pays de livraison. Taux normaux en % ; à vérifier chaque année avec l'expert-comptable.
 */
export const vatRates: Record<string, number> = {
  AT: 20,
  BE: 21,
  BG: 20,
  HR: 25,
  CY: 19,
  CZ: 21,
  DK: 25,
  EE: 24,
  FI: 25.5,
  FR: 20,
  DE: 19,
  GR: 24,
  HU: 27,
  IE: 23,
  IT: 22,
  LV: 21,
  LT: 21,
  LU: 17,
  MT: 18,
  NL: 21,
  PL: 23,
  PT: 23,
  RO: 21,
  SK: 23,
  SI: 22,
  ES: 21,
  SE: 25,
};

/** Pays d'établissement du vendeur (régime « origine » sous le seuil de 10 000 € de ventes UE). */
export const SELLER_COUNTRY = "FR";

export type VatMode = "destination" | "origin";

/** Taux de TVA applicable à une commande livrée dans `country`. */
export function vatRateFor(country: string, mode: VatMode = "destination") {
  const code = mode === "origin" ? SELLER_COUNTRY : country.toUpperCase();
  return vatRates[code] ?? vatRates[SELLER_COUNTRY];
}

export type VatLine = {
  label: string;
  quantity: number;
  /** Montants en centimes. */
  unitHt: number;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
};

/**
 * Extrait la TVA d'un montant TTC en centimes. Calcul ligne par ligne : la somme des lignes est
 * toujours égale au total TTC payé, sans écart d'arrondi.
 */
export function splitVat(ttcCents: number, ratePercent: number) {
  const ht = Math.round((ttcCents * 100) / (100 + ratePercent));
  return { ht, vat: ttcCents - ht };
}

/** Formate des centimes en « 1 234,56 € » avec des espaces simples (compatibles avec les PDF). */
export function formatCents(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${euros},${String(abs % 100).padStart(2, "0")} \u20ac`;
}

/** Taux en texte français : 20 → « 20 % », 25.5 → « 25,5 % ». */
export function formatRate(ratePercent: number) {
  return `${String(ratePercent).replace(".", ",")} %`;
}
