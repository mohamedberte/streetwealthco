---
description: "Conformite boutique en ligne France / UE (consommation, RGPD, e-mails) pour TRIPLEX. Use when editing legal texts, shipping, brand/company info, e-mails or the order tracking page."
applyTo: "src/lib/legal.ts,src/lib/shipping.ts,src/lib/brand.ts,src/server/emails.ts,src/app/commande/**,src/app/actions.ts"
---
# Conformite - points a verifier

## Consommateur (France / UE)
- Prix TTC en EUR, frais de livraison affiches avant paiement.
- Droit de retractation de 14 jours (`policy.withdrawalDays`) : texte, formulaire/modalites et remboursement coherents avec `legal.ts`.
- Informations obligatoires presentes et renseignees dans `brand.ts` (objet `company`) : identite du vendeur, adresse, contact, numero d'immatriculation, TVA/OSS, mediateur de la consommation, hebergeur. Aucun placeholder `[...]` ne doit rester en production.
- CGV, livraison, retours, mentions legales, confidentialite : toute modification de fond est a faire valider par un juriste. Ne jamais presenter ces textes comme un avis juridique.

## RGPD
- Donnees minimales : nom, e-mail, telephone, adresse, commande ; e-mail pour la liste d'attente ; e-mail (connexion par code, sans mot de passe, via Supabase Auth) pour un compte client. Suppression du compte disponible dans `/compte`.
- Chaque e-mail de liste d'attente contient un lien de desinscription signe.
- La page de confidentialite liste fidelement les destinataires (Stripe, Resend, Vercel, Supabase, AWS, transporteur) et les durees de conservation.
- Pas de traceur ni d'outil de mesure sans consentement ou sans solution exemptee (si ajoute : mettre a jour la page Confidentialite).

## E-mails
- Tout contenu dynamique insere dans un e-mail HTML est echappe (`escape`). Aucun secret ni jeton dans le sujet.
- Le lien de suivi utilise le jeton de commande (non devinable, page `noindex`).

## Commande
- La reservation de stock dure `policy.reservationMinutes` ; paiement tardif sur stock epuise -> statut `refund_needed`.
- Les remboursements passent par l'admin (Stripe), avec idempotence et e-mail au client.
