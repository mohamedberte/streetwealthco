/** Transporteurs proposés dans l'admin, avec le lien de suivi public de chacun. */
export const carriers = {
  colissimo: { label: "Colissimo", url: "https://www.laposte.fr/outils/suivre-vos-envois?code=" },
  chronopost: {
    label: "Chronopost",
    url: "https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=",
  },
  dhl: { label: "DHL", url: "https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=" },
  ups: { label: "UPS", url: "https://www.ups.com/track?tracknum=" },
  dpd: { label: "DPD", url: "https://trace.dpd.fr/fr/trace/" },
  mondialrelay: {
    label: "Mondial Relay",
    url: "https://www.mondialrelay.fr/suivi-de-colis?numeroExpedition=",
  },
  other: { label: "Autre transporteur", url: "" },
} as const;

export type CarrierId = keyof typeof carriers;
export const carrierIds = Object.keys(carriers) as CarrierId[];

export const isCarrierId = (value: string): value is CarrierId => Object.hasOwn(carriers, value);

/** Numéro de suivi plausible (lettres, chiffres, tirets) ; sert aussi à fabriquer l'URL. */
export const TRACKING_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

/** Lien de suivi du transporteur, ou null si le transporteur n'a pas de lien ou le numéro est douteux. */
export function trackingUrl(carrier: string | null, tracking: string | null) {
  if (!carrier || !tracking || !isCarrierId(carrier) || !TRACKING_PATTERN.test(tracking)) return null;
  const base = carriers[carrier].url;
  return base ? `${base}${encodeURIComponent(tracking)}` : null;
}

export const carrierLabel = (carrier: string | null) =>
  carrier && isCarrierId(carrier) ? carriers[carrier].label : null;
