import { brand, company as defaultCompany, companyAddress, type Company } from "@/lib/brand";
import { formatPrice } from "@/lib/products";
import { policy, zones } from "@/lib/shipping";

export type LegalPage = {
  slug: string;
  title: string;
  intro?: string;
  sections: { heading: string; body: string[] }[];
};

/**
 * Textes des pages d'information, pour une vente à des consommateurs en France et dans l'Union
 * européenne. Base de travail : à FAIRE VALIDER par un juriste avant la mise en ligne. Les
 * informations société viennent de l'admin (/admin/societe), à défaut de `src/lib/brand.ts`.
 */
export function buildLegalPages(company: Company = defaultCompany): LegalPage[] {
  return [
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    intro: `Les présentes conditions régissent les ventes conclues sur le site ${brand.name} entre ${company.legalName} (le vendeur) et tout consommateur (le client).`,
    sections: [
      {
        heading: "1. Pièces et disponibilité",
        body: [
          "Les pièces sont proposées en éditions limitées ou permanentes, dans la limite des stocks affichés. La disponibilité est indiquée en temps réel, par taille.",
          `Lors d'une commande, les pièces sont réservées ${policy.reservationMinutes} minutes le temps du paiement. Passé ce délai sans paiement, la réservation est levée.`,
        ],
      },
      {
        heading: "2. Prix",
        body: [
          "Les prix sont indiqués en euros, toutes taxes comprises. La TVA appliquée est celle du pays de livraison au sein de l'Union européenne ; elle est détaillée sur la facture. Les frais de livraison sont indiqués avant la validation de la commande.",
          "Une facture est émise dès le paiement : elle est jointe à l'e-mail de confirmation et téléchargeable depuis la page de suivi de commande.",
        ],
      },
      {
        heading: "3. Commande",
        body: [
          `La commande est limitée à ${policy.maxQuantity} exemplaires par pièce et par taille. Elle est définitive après paiement ; un e-mail de confirmation est alors envoyé.`,
          `${company.legalName} peut refuser ou annuler une commande en cas de litige existant, de coordonnées incohérentes ou de suspicion de fraude, avec remboursement intégral.`,
        ],
      },
      {
        heading: "4. Paiement",
        body: [
          "Le paiement s'effectue en ligne par carte bancaire (ainsi que par les moyens proposés sur la page de paiement) via notre prestataire sécurisé Stripe. Nous ne conservons aucune donnée de carte bancaire.",
        ],
      },
      {
        heading: "5. Livraison",
        body: ["Les zones, délais et frais de livraison sont détaillés dans la page Livraison."],
      },
      {
        heading: "6. Droit de rétractation",
        body: [
          `Conformément au Code de la consommation, le client dispose de ${policy.withdrawalDays} jours à compter de la réception de sa commande pour se rétracter, sans avoir à justifier de motif. Les modalités sont détaillées dans la page Rétractation et retours.`,
        ],
      },
      {
        heading: "7. Garanties légales",
        body: [
          "Le vendeur est tenu de la garantie légale de conformité et de la garantie légale contre les vices cachés, dans les conditions prévues par le Code de la consommation et le Code civil.",
        ],
      },
      {
        heading: "8. Propriété intellectuelle",
        body: [
          `Les visuels, textes, logos et créations présentés sur ce site sont la propriété de ${company.legalName} et ne peuvent être reproduits sans autorisation écrite.`,
        ],
      },
      {
        heading: "9. Médiation et litiges",
        body: [
          "En cas de litige, le client peut d'abord contacter le service client. À défaut de solution amiable, il peut recourir gratuitement au médiateur de la consommation :",
          company.mediator,
          "Le client consommateur conserve le bénéfice des dispositions impératives de la loi de son pays de résidence.",
        ],
      },
    ],
  },
  {
    slug: "livraison",
    title: "Livraison",
    sections: [
      {
        heading: "Zones, délais et frais",
        body: [
          `${zones.france.label} : ${formatPrice(zones.france.fee)}, livraison en ${zones.france.delay}.`,
          `${zones.europe.label} : ${formatPrice(zones.europe.fee)}, livraison en ${zones.europe.delay}.`,
          "Les délais courent à compter de l'expédition de la commande.",
        ],
      },
      {
        heading: "Suivi",
        body: [
          "Un e-mail de confirmation est envoyé au paiement, puis un second à l'expédition, avec le numéro de suivi du transporteur lorsqu'il existe. Une page de suivi est accessible à tout moment depuis le lien reçu par e-mail.",
        ],
      },
      {
        heading: "Réception",
        body: [
          "À réception, vérifiez l'état du colis. En cas de dommage ou de colis manquant, signalez-le-nous sous 48 heures à l'adresse ci-dessous.",
          `Contact : ${brand.email}`,
        ],
      },
    ],
  },
  {
    slug: "retours",
    title: "Rétractation et retours",
    sections: [
      {
        heading: "Délai de rétractation",
        body: [
          `Vous disposez de ${policy.withdrawalDays} jours à compter de la réception de votre commande pour vous rétracter, sans motif. Informez-nous de votre décision par e-mail à ${brand.email}, en indiquant votre numéro de commande (TRX-…).`,
        ],
      },
      {
        heading: "Retour de la pièce",
        body: [
          `Vous disposez ensuite de ${policy.withdrawalDays} jours pour renvoyer la pièce, neuve, non portée, non lavée, avec ses étiquettes, à l'adresse suivante : ${company.returnAddress}. Les frais de retour sont à votre charge.`,
        ],
      },
      {
        heading: "Remboursement",
        body: [
          "Nous vous remboursons la totalité des sommes versées, y compris les frais de livraison standard, au plus tard 14 jours après avoir reçu votre décision de vous rétracter, par le même moyen de paiement. Nous pouvons différer le remboursement jusqu'à la réception de la pièce ou la preuve de son expédition.",
          "Seule la dépréciation de la pièce résultant de manipulations autres que celles nécessaires pour en vérifier la nature et le bon fonctionnement peut être déduite.",
        ],
      },
      {
        heading: "Échange de taille",
        body: [
          "Sur demande, un échange de taille est possible sous réserve de disponibilité, dans le même délai.",
        ],
      },
    ],
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    sections: [
      {
        heading: "Éditeur",
        body: [
          `${company.legalName} — ${company.legalForm}, capital de ${company.shareCapital}`,
          `SIRET : ${company.siret} · RCS ${company.rcs}`,
          `TVA intracommunautaire : ${company.vatNumber}`,
          `Siège : ${companyAddress(company)}`,
          `Contact : ${brand.email} · ${company.phone}`,
          `Directeur de la publication : ${company.publisher}`,
        ],
      },
      {
        heading: "Hébergement",
        body: [company.host],
      },
      {
        heading: "Médiation de la consommation",
        body: [company.mediator],
      },
      {
        heading: "Propriété intellectuelle",
        body: [
          `L'ensemble des contenus du site ${brand.name} est protégé. Toute reproduction sans autorisation est interdite.`,
        ],
      },
    ],
  },
  {
    slug: "confidentialite",
    title: "Confidentialité",
    intro:
      "Nous collectons uniquement les données nécessaires au traitement de vos commandes, conformément au règlement général sur la protection des données (RGPD).",
    sections: [
      {
        heading: "Données collectées",
        body: [
          "Nom, e-mail, téléphone, adresse de livraison et contenu de la commande ; adresse e-mail pour les alertes de retour en stock ; adresse e-mail si vous créez un compte client.",
        ],
      },
      {
        heading: "Finalités et bases légales",
        body: [
          "Exécution du contrat (traitement et livraison des commandes), obligations comptables et légales, intérêt légitime (prévention de la fraude, service client), consentement (alertes de retour en stock).",
        ],
      },
      {
        heading: "Destinataires",
        body: [
          "Nos prestataires strictement nécessaires : paiement (Stripe), envoi d'e-mails (Resend), hébergement, base de données et authentification (Vercel, Supabase), stockage des images et des factures (Amazon Web Services), transport. Pour livrer en France, la saisie de votre adresse peut être complétée automatiquement par la Base Adresse Nationale (service public) et, pour les autres pays de l'Union européenne, par le service de géocodage Photon (données OpenStreetMap) : seul le début de l'adresse tapée leur est transmis, par notre serveur. Certains peuvent traiter des données hors de l'Union européenne, avec des garanties appropriées. Aucune donnée n'est vendue.",
        ],
      },
      {
        heading: "Conservation",
        body: [
          "Les données de commande, y compris les factures et avoirs, sont conservées 10 ans pour nos obligations comptables et fiscales. Les inscriptions aux alertes sont conservées jusqu'à notification ou demande de suppression. Un compte client est conservé jusqu'à sa suppression, que vous pouvez faire à tout moment depuis la page Compte (vos commandes restent conservées de façon détachée du compte pour nos obligations comptables).",
        ],
      },
      {
        heading: "Vos droits",
        body: [
          `Vous pouvez demander l'accès, la rectification, l'effacement ou la portabilité de vos données, et vous opposer à leur traitement, en écrivant à ${brand.email}. Vous pouvez aussi saisir la CNIL (cnil.fr).`,
        ],
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    sections: [
      {
        heading: "Nous écrire",
        body: [
          `E-mail : ${brand.email}`,
          `Téléphone : ${company.phone}`,
          `Atelier : ${brand.city}, ${brand.country}`,
          "Pour toute question sur une commande, indiquez votre numéro de commande (TRX-…).",
        ],
      },
    ],
  },
];
}
