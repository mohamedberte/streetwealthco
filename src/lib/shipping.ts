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

export const policy = {
  /** Délai de rétractation légal pour les consommateurs, en jours. */
  withdrawalDays: 14,
  /** Quantité maximale par ligne de commande. */
  maxQuantity: 3,
  /** Durée de réservation du stock pendant le paiement, en minutes (30 min minimum pour Stripe). */
  reservationMinutes: 30,
} as const;
