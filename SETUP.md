# TRIPLEX - Installation et mise en service

Boutique en ligne (vente en France et dans l'UE, prix en EUR TTC). Ce document liste tout ce qu'il faut installer, configurer et completer.

## 1. Prerequis

- Node.js 20 ou plus recent (npm inclus)
- Un compte Neon (PostgreSQL), Stripe, Resend et Vercel
- Stripe CLI (tests locaux du webhook) : https://docs.stripe.com/stripe-cli

## 2. Installation

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Le site est sur http://localhost:3000. Remarque : si `npm install` echoue derriere un registre d'entreprise (Artifactory), l'executer depuis une machine avec acces au registre public npm ; le fichier `package-lock.json` doit etre commite.

Verifier ensuite la compilation :

```powershell
npm run lint
npm run build
```

Le code a ete ecrit sans compilation : corriger les eventuelles erreurs de type au premier `npm run build`.

## 3. Variables d'environnement (`.env.local`)

| Variable | Role |
| --- | --- |
| `SITE_URL` | URL publique (sans slash final) |
| `DATABASE_URL` | Chaine de connexion Neon (`?sslmode=require`) |
| `STRIPE_SECRET_KEY` | Cle secrete Stripe (`sk_test_...` puis `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook (`whsec_...`) |
| `RESEND_API_KEY` | Cle Resend (sans cle : e-mails ecrits dans la console) |
| `MAIL_FROM` | Expediteur, domaine verifie dans Resend |
| `ADMIN_EMAIL` | Recoit les alertes de commande |
| `ADMIN_PASSWORD` | Mot de passe de `/admin` |
| `ADMIN_SESSION_SECRET` | Chaine aleatoire de 32 caracteres minimum |

Generer le secret de session :

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Base de donnees (Neon)

1. Creer un projet Neon et copier la chaine de connexion dans `DATABASE_URL`.
2. Les tables sont creees automatiquement au premier appel (voir `src/server/schema.ts`).
3. Le stock par taille est initialise depuis `src/lib/products.ts` (`stockPerSize`) ; il se modifie ensuite dans `/admin`.

## 5. Stripe

1. Activer le compte Stripe et verifier que les paiements en EUR sont acceptes pour votre entite.
2. Utiliser d'abord les cles de test (`sk_test_...`).
3. Webhook en production : Developers > Webhooks > Ajouter un endpoint
   - URL : `https://<domaine>/api/stripe/webhook`
   - Evenements : `checkout.session.completed` et `checkout.session.async_payment_succeeded`
   - Copier le secret `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.
4. Test local :

```powershell
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

   Copier le `whsec_...` affiche dans `.env.local`. Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque.
5. Moyens de paiement (Apple Pay, etc.) : actives dans le tableau de bord Stripe.

Fonctionnement : la commande reserve le stock 30 minutes, redirige vers Stripe Checkout, et le webhook confirme la commande. Un paiement arrive apres expiration de la reservation passe la commande en `refund_needed` (remboursement manuel depuis Stripe).

## 6. E-mails (Resend)

Creer un compte, verifier votre domaine d'envoi, copier la cle dans `RESEND_API_KEY` et definir `MAIL_FROM`.

## 7. Deploiement (Vercel)

1. Importer le depot dans Vercel.
2. Ajouter toutes les variables du tableau ci-dessus (`SITE_URL` = domaine final).
3. Declarer le webhook Stripe avec le domaine final (section 5).

## 8. A completer avant la mise en ligne

- `src/lib/brand.ts` : raison sociale, forme juridique, RCCM, compte contribuable, TVA / OSS, adresse, telephone, directeur de publication, adresse de retour des colis, mediateur de la consommation, e-mail de contact.
- `src/lib/products.ts` : prix TTC, stocks, visuels.
- `src/lib/shipping.ts` : frais et delais France / UE.
- `src/lib/legal.ts` : textes CGV, livraison, retractation, mentions, confidentialite. A faire relire par un juriste.

## 9. Points d'attention

- Expedier depuis la Cote d'Ivoire vers la France implique douane, TVA a l'importation et eventuellement le guichet OSS / IOSS : a valider avec un comptable ou un transitaire. Les prix affiches sont TTC.
- Un mediateur de la consommation est obligatoire pour vendre a des consommateurs en France.
- Informer l'acheteur du droit de retractation de 14 jours (deja integre au parcours et aux CGV).
- Pas de compte client : les commandes sont suivies via `/commande/<jeton>` (lien envoye par e-mail).

## 10. Limites connues

- Pas de remboursement automatise : les retours et remboursements se font depuis Stripe et `/admin`.
- Pas de calcul de TVA par pays (prix TTC unique) ni de frais de livraison au poids.
- Livraison limitee a la France et a l'UE (deux zones forfaitaires).
