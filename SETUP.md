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
| `S3_BUCKET` | Nom du bucket des images (minuscules, chiffres, tirets ; sans point) |
| `S3_REGION` | Region du bucket (ex. `eu-west-3`) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Cle d'un utilisateur IAM limite a l'ecriture dans le bucket (section 6 bis) |
| `CLOUDFRONT_URL` | URL publique CloudFront en `https://` (ex. `https://dxxxx.cloudfront.net` ou votre domaine) |
| `S3_PREFIX` | Optionnel : dossier du bucket (defaut `media`) |

Generer le secret de session :

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Base de donnees (Neon)

Neon fournit uniquement une base PostgreSQL : pas de comptes clients ni de connexion integres. C'est voulu : les clients commandent en invite, l'admin est protege par un mot de passe (voir section 9).

1. Creer un projet Neon (region UE, par exemple Francfort) et copier la chaine de connexion (`?sslmode=require`) dans `DATABASE_URL`. Utiliser l'URL avec pooler (`-pooler`) en production sur Vercel.
   Ne jamais exposer cette URL cote navigateur (pas de prefixe `NEXT_PUBLIC_`).
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

## 6 bis. Images (S3 et CloudFront)

Les photos des pieces et le logo envoyes depuis `/admin` sont stockes dans un bucket S3 prive et servis au public par CloudFront. Le site envoie le fichier a S3 (requete signee SigV4, sans SDK) et enregistre en base l'URL CloudFront. Chaque envoi cree un nouvel objet (`media/<cle>/<horodatage>.<ext>`) : cache long, aucune invalidation CloudFront necessaire, ancien fichier supprime automatiquement.

Mise en place cote AWS :
1. **Bucket S3** : region de votre choix, nom sans point, "Block all public access" active, chiffrement par defaut active. Pas d'ACL.
2. **Distribution CloudFront** : origine = ce bucket (domaine S3 regional), acces via **Origin Access Control (OAC)**, "Redirect HTTP to HTTPS", compression activee, et la response headers policy geree `SecurityHeadersPolicy` (ajoute `X-Content-Type-Options: nosniff`). Copier la bucket policy proposee par CloudFront, limitee au prefixe `media/*` :

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontRead",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::<BUCKET>/media/*",
    "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::<COMPTE>:distribution/<ID>" } }
  }]
}
```

3. **Utilisateur IAM** dedie au site, sans acces console, avec uniquement ce droit :

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::<BUCKET>/media/*"
  }]
}
```

4. Renseigner `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` et `CLOUDFRONT_URL` (localement dans `.env.local`, sur Vercel dans les variables du projet). Ne jamais mettre ces cles dans le code ni dans un chat ; les renouveler en cas de fuite.
5. `CLOUDFRONT_URL` est lue au demarrage et a la construction (`next.config.ts` autorise ce domaine pour `next/image`) : **redeployer apres l'avoir changee**.

Sans cette configuration, l'admin affiche "Stockage d'images indisponible" et les illustrations dessinees restent utilisees. Les visuels du dossier `public/` fonctionnent toujours.

## 7. Deploiement (Vercel)

1. Importer le depot dans Vercel.
2. Ajouter toutes les variables du tableau ci-dessus (`SITE_URL` = domaine final).
3. Declarer le webhook Stripe avec le domaine final (section 5).

## 8. Suivi de commande et e-mails

1. Paiement confirme (webhook Stripe) : e-mail de confirmation au client (recapitulatif, droit de retractation, lien de suivi) et alerte a `ADMIN_EMAIL`.
2. Expedition (bouton dans `/admin`, numero de suivi optionnel) : e-mail "commande expediee" avec le lien de suivi.
3. Page de suivi `/commande/<jeton>` : le jeton est aleatoire (144 bits), unique par commande, envoye uniquement par e-mail. Elle affiche le statut, les pieces et le suivi du colis. Pas de compte client.
4. Retour en stock : e-mail aux personnes inscrites sur la liste d'attente, avec lien de desinscription signe.
5. Remboursement (bouton dans `/admin`) : e-mail de confirmation au client.

Statuts : paiement en attente, a expedier, expediee, livree, annulee, expiree, remboursement a faire, remboursee.

### Espace admin (`/admin`)

- Indicateurs : CA 7 j / 30 j / total (TTC), commandes payees, panier moyen, a expedier, remboursements a faire, paiements en attente, ventes par piece, alertes de stock bas (3 pieces ou moins).
- Commandes : filtres par statut, expedition avec numero de suivi, livraison, annulation des commandes non payees.
- Remboursement : bouton "Rembourser" (remboursement integral via Stripe, avec case "remettre en stock" si le retour est recu). Pour une commande payee, c'est la seule facon de l'annuler ; ne pas rembourser depuis le tableau de bord Stripe pour garder les statuts a jour.
- Stock par taille, et liste d'attente : inscrits par piece et taille, bouton "Prevenir maintenant", retrait d'une adresse.
- Pieces (`/admin/produits`) : creer une piece, modifier nom, prix, tailles, edition, matiere, description, couleurs et illustration, ordre d'affichage ; envoyer ou retirer une photo (PNG, JPEG ou WebP, 3 Mo max, stockee sur S3 et servie par CloudFront) ; archiver ou restaurer (une piece n'est jamais supprimee car les commandes y font reference). Le stock se regle depuis le tableau de bord.
- Looks (dans `/admin/produits`, par piece, 8 max) : photos portees par lieu ou ambiance, ouvertes sur le site au clic sur la piece ou via « Voir les looks ». Titre, legende, ordre ; images stockees sur S3 sous `media/scene-<slug>/`. Specifications et prompts pour le generateur d'images : `docs/prompts-images.md`.
- Contenu (`/admin/contenu`) : texte des pages Informations (CGV, livraison, retours, mentions, confidentialite, contact), creation de nouvelles pages, retour au texte d'origine, accroche sous le logo, logo (image ou logotype texte). Format des textes : `## Titre` ouvre une section, une ligne vide separe les paragraphes.
- Source de verite : `src/lib/products.ts` et `src/lib/legal.ts` ne servent que de valeurs par defaut. Une modification faite dans l'admin (ligne en base de meme identifiant) remplace la valeur du code ; modifier ensuite le fichier du code n'a plus d'effet sur cette piece ou cette page. Coordonnees de la societe (`brand.ts`) : restent dans le code, car elles ont une portee legale.
- Non inclus : taux de conversion et visites. Pour l'audience, ajouter un outil respectueux de la vie privee (Vercel Analytics ou Plausible).

### Agent et controles de securite (VS Code / Copilot)

Dossier `.github/` :
- Agents : **Security Auditor** (audit de securite en lecture seule) et **Release Reviewer** (revue avant livraison, lint, types, build).
- Prompts (taper `/` dans le chat) : `/security-audit`, `/pre-release-check`, `/dependency-audit`.
- Instructions appliquees automatiquement selon les fichiers modifies : securite (`src/server`, actions, routes, admin, `next.config.ts`), qualite Next.js, conformite boutique FR/UE.
- Habitude conseillee : `/pre-release-check` avant chaque deploiement, `/security-audit` apres toute modification de l'admin, du paiement, des uploads ou de la base, `/dependency-audit` chaque mois.

## 9. Securite

Mesures en place :
- Paiement : aucune donnee de carte cote serveur (Stripe Checkout) ; webhook verifie par signature HMAC avec tolerance de 5 minutes, puis statut et montant reverifies aupres de Stripe.
- Prix et totaux recalcules cote serveur depuis le catalogue en base (`src/server/catalog.ts`) / `shipping.ts` ; le navigateur n'envoie que pieces, tailles et quantites.
- Stock : reservation atomique en transaction SQL (verrous), sans survente.
- Requetes SQL parametrees, entrees validees avec zod, sorties HTML echappees (e-mails).
- Admin `/admin` : mot de passe compare en temps constant, cookie `HttpOnly`, `SameSite=Strict`, `Secure` en production, signe HMAC, expire en 8 h, limitation a 5 echecs par 15 min et par visiteur, pages non indexees et jamais mises en cache. Toutes les actions admin reverifient la session cote serveur.
- Anti-abus : limitation de debit sur la creation de commande (le stock est reserve 30 min) et sur la liste d'attente. Adresses IP et e-mails ne sont stockes que sous forme d'empreinte, purgee apres 2 jours.
- En-tetes HTTP : HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP (anti-framing, formulaires limites a notre domaine et Stripe).
- Envois de photos : formats PNG/JPEG/WebP uniquement, type verifie sur le contenu du fichier, 3 Mo maximum, reserves a l'admin connecte (controle de l'origine de la requete en plus du cookie `SameSite=Strict`). Bucket S3 prive (lecture uniquement via CloudFront/OAC), compte IAM limite a `PutObject`/`DeleteObject` sur le prefixe `media/`.
- Secrets uniquement en variables d'environnement (`.env.local` ignore par git).

A faire de votre cote :
- `ADMIN_PASSWORD` : 20 caracteres ou plus, unique (gestionnaire de mots de passe). Ne jamais reutiliser un mot de passe.
- Activer la 2FA sur GitHub, Vercel, Stripe, Neon et Resend. Proteger la branche principale.
- Renforcer l'acces admin : Vercel Deployment Protection / Cloudflare Access sur `/admin`, ou restriction par IP.
- Verifier SPF, DKIM et DMARC du domaine d'envoi (anti-usurpation).
- Cles Stripe : en production uniquement dans Vercel (jamais dans le code ni dans un chat) ; en cas de fuite, les regenerer.
- Lancer `npm audit` regulierement et garder Next.js a jour.
- Activer les sauvegardes Neon (point-in-time restore) et surveiller les journaux Vercel.
- Conserver les donnees de commande uniquement la duree legale (obligations comptables) et traiter les demandes RGPD sous un mois.

## 10. A completer avant la mise en ligne

- `src/lib/brand.ts` : raison sociale, forme juridique, RCCM, compte contribuable, TVA / OSS, adresse, telephone, directeur de publication, adresse de retour des colis, mediateur de la consommation, e-mail de contact.
- `src/lib/products.ts` : valeurs par defaut des pieces (prix TTC, stocks initiaux, visuels). Apres le premier demarrage, gerer les pieces depuis `/admin/produits`.
- `src/lib/shipping.ts` : frais et delais France / UE.
- `src/lib/legal.ts` : textes par defaut (CGV, livraison, retractation, mentions, confidentialite), modifiables depuis `/admin/contenu`. A faire relire par un juriste.

## 11. Points d'attention

- Expedier depuis la Cote d'Ivoire vers la France implique douane, TVA a l'importation et eventuellement le guichet OSS / IOSS : a valider avec un comptable ou un transitaire. Les prix affiches sont TTC.
- Un mediateur de la consommation est obligatoire pour vendre a des consommateurs en France.
- Informer l'acheteur du droit de retractation de 14 jours (deja integre au parcours et aux CGV).
- Pas de compte client : les commandes sont suivies via `/commande/<jeton>` (lien envoye par e-mail).

## 12. Limites connues

- Remboursements : integraux uniquement (pas de remboursement partiel) ; un remboursement fait depuis le tableau de bord Stripe n'est pas synchronise avec la commande.
- Pas de calcul de TVA par pays (prix TTC unique) ni de frais de livraison au poids.
- Livraison limitee a la France et a l'UE (deux zones forfaitaires).
