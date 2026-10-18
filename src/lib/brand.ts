export const brand = {
  name: "TRIPLEX",
  tagline: "L'expression d'un style distinctif qui transcende les frontières.",
  city: "Abidjan",
  country: "Côte d'Ivoire",
  email: "contact@triplexbrand.com",
} as const;

export type Company = {
  legalName: string;
  legalForm: string;
  shareCapital: string;
  siret: string;
  /** Ville du greffe, ex. « Paris ». */
  rcs: string;
  /** N° de TVA intracommunautaire (FR + 11 chiffres). */
  vatNumber: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  publisher: string;
  /** Adresse de retour des colis (droit de rétractation). */
  returnAddress: string;
  /** Médiateur de la consommation (obligatoire pour vendre à des consommateurs en France). */
  mediator: string;
  host: string;
};

/**
 * Valeurs par défaut des informations légales de la structure. Elles sont surchargées par les
 * réglages de l'admin (/admin/societe), qui font foi pour les factures et les mentions légales.
 */
export const company: Company = {
  legalName: "[Raison sociale]",
  legalForm: "[Forme juridique : SAS, SARL, entreprise individuelle…]",
  shareCapital: "[Capital social]",
  siret: "[N° SIRET]",
  rcs: "[Ville du RCS]",
  vatNumber: "[N° de TVA intracommunautaire]",
  address: "[Adresse]",
  postalCode: "[Code postal]",
  city: "[Ville]",
  country: "France",
  phone: "[Téléphone]",
  publisher: "[Nom du directeur de la publication]",
  returnAddress: "[Adresse de retour des colis]",
  mediator: "[Nom, adresse et site du médiateur de la consommation]",
  host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
};

/** Adresse postale du siège sur une ligne. */
export const companyAddress = (c: Company) => `${c.address}, ${c.postalCode} ${c.city}, ${c.country}`;

/** Champs encore à renseigner (valeur vide ou entre crochets). */
export function missingCompanyFields(c: Company) {
  return (Object.keys(c) as (keyof Company)[]).filter((key) => {
    const value = c[key].trim();
    return value === "" || value.startsWith("[");
  });
}
