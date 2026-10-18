export const brand = {
  name: "TRIPLEX",
  tagline: "L'expression d'un style distinctif qui transcende les frontières.",
  city: "Abidjan",
  country: "Côte d'Ivoire",
  email: "contact@triplexbrand.com",
} as const;

/**
 * Informations légales de la structure (pages Mentions légales et CGV).
 * À COMPLÉTER avec les données réelles avant la mise en ligne.
 */
export const company = {
  legalName: "[Raison sociale]",
  legalForm: "[Forme juridique : SARL, SARLU, entreprise individuelle…]",
  rccm: "[N° RCCM]",
  taxId: "[N° de compte contribuable]",
  vatNumber: "[N° de TVA / identifiant OSS, si applicable]",
  address: "[Adresse complète], Abidjan, Côte d'Ivoire",
  phone: "[Téléphone]",
  publisher: "[Nom du directeur de la publication]",
  /** Adresse de retour des colis (droit de rétractation). */
  returnAddress: "[Adresse de retour des colis]",
  /** Médiateur de la consommation (obligatoire pour vendre à des consommateurs en France). */
  mediator: "[Nom, adresse et site du médiateur de la consommation]",
  host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
} as const;
