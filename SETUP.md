# TRIPLEX - Installation et mise en service

Boutique en ligne (vente en France et dans l'UE, prix en EUR TTC). Ce document liste tout ce qu'il faut installer, configurer et completer.

## 1. Prerequis

- Node.js 20 ou plus recent (npm inclus)
- Un compte Supabase (base PostgreSQL + authentification), Stripe, Resend, AWS (S3 + CloudFront) et Vercel
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
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (publique) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cle publique Supabase (`sb_publishable_...`, ou l'ancienne cle `anon` via `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle `service_role` : serveur uniquement, jamais dans le navigateur ni dans un chat |
| `APP_SECRET` | Chaine aleatoire de 32 caracteres minimum (liens de desinscription, empreintes anti-abus) |
| `STRIPE_SECRET_KEY` | Cle secrete Stripe (`sk_test_...` puis `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook (`whsec_...`) |
| `RESEND_API_KEY` | Cle Resend (sans cle : e-mails ecrits dans la console) |
| `MAIL_FROM` | Expediteur, domaine verifie dans Resend |
| `ADMIN_EMAIL` | Recoit les alertes de commande |
| `S3_BUCKET` | Nom du bucket des images (minuscules, chiffres, tirets ; sans point) |
| `S3_REGION` | Region du bucket (ex. `eu-west-3`) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Cle d'un utilisateur IAM limite a l'ecriture dans le bucket (section 6 bis) |
| `CLOUDFRONT_URL` | URL publique CloudFront en `https://` (ex. `https://dxxxx.cloudfront.net` ou votre domaine) |
| `S3_PREFIX` | Optionnel : dossier du bucket (defaut `media`) |

Generer `APP_SECRET` :

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Base de donnees et comptes (Supabase)

Supabase fournit la base PostgreSQL et l'authentification. Les images restent sur AWS (S3 + CloudFront, section 6 bis). Le site accede aux donnees uniquement depuis le serveur, avec la cle `service_role`, apres avoir verifie les droits ; le RLS est actif sur toutes les tables (lecture publique du catalogue et des pages, un client ne lit que ses commandes).

1. Creer un projet Supabase (region UE, par exemple Francfort). Renseigner `NEXT_PUBLIC_SUPABASE_URL`, la cle publique et `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API).
2. Creer les tables et fonctions : ouvrir SQL Editor, coller le contenu de `supabase/migrations/20261017000000_init.sql` et l'executer (ou `supabase db push` avec la CLI Supabase). Executer ensuite, dans l'ordre, les fichiers suivants de `supabase/migrations/` (ex. `20261018000000_country.sql` : pays de livraison des commandes UE ; `20261019000000_documents.sql` : factures, avoirs, historique des commandes, transporteur ; `20261020000000_decimal_prices.sql` : prix avec centimes ; `20261021000000_drops.sql` : ouverture programmee d'une piece). Les transactions sensibles (reservation de stock, paiement, annulation, remboursement) sont des fonctions SQL reservees au `service_role`.
3. Le stock par taille est initialise depuis `src/lib/products.ts` (`stockPerSize`) ; il se modifie ensuite dans `/admin`.
4. **Compte administrateur** : Authentication > Users > Add user (e-mail + mot de passe fort, cocher "Auto Confirm User"), puis dans SQL Editor :

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
where email = 'vous@exemple.com';
```

   Le role se lit dans `app_metadata`, que seul le serveur (ou ce SQL) peut modifier : un client ne peut pas se l'attribuer. Se connecter ensuite sur `/admin` avec e-mail et mot de passe. Activer la 2FA sur ce compte des que possible.
5. **Authentication > URL Configuration** : `Site URL` = votre domaine final (`SITE_URL`) ; ajouter `http://localhost:3000/**` et le domaine final dans `Redirect URLs`.
6. **Authentication > Email Templates** : la connexion se fait par un code a usage unique recu par e-mail (aucun lien, donc rien a consommer par un scanner de messagerie). Modeles complets en francais, aux couleurs de TRIPLEX, dans `supabase/templates/` : copier le HTML dans "Message body" et l'objet indique en commentaire en tete de fichier.
   - *Confirm signup* (premier code d'un nouveau client) : `confirmation.html`
   - *Magic link* (client deja inscrit) : `magic-link.html`
   - Les autres modeles ne sont pas utilises par le site ; laisser les defauts.
   - Longueur du code : Authentication > Providers > Email > "Email OTP Length" (6 par defaut ; le site accepte 6 a 10 chiffres). Expiration : 3600 s par defaut.
7. **Authentication > Providers > Email** : garder "Confirm email" actif. Configurer un SMTP personnalise (Resend convient) AVANT la mise en ligne : chaque connexion envoie un e-mail et le SMTP integre de Supabase est limite a quelques messages par heure.
8. Sauvegardes : activer les sauvegardes quotidiennes (offre payante) ou exporter regulierement la base.

Comptes clients : facultatifs, sans mot de passe. Page `/compte` : un champ e-mail, un code recu par message, et le compte existe (creation au premier code valide). Le paiement pre-remplit les coordonnees d'un client connecte, et la page de suivi de commande propose d'activer le compte en un geste. Historique des commandes et suppression du compte dans `/compte`. La commande invite reste possible. Les commandes passees avec l'adresse e-mail confirmee d'un compte apparaissent dans son historique.

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

3. **Utilisateur IAM** dedie au site, sans acces console, avec uniquement ces droits (`media/` : images publiques ; `documents/` : factures et avoirs prives, jamais supprimes par le site) :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<BUCKET>/media/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::<BUCKET>/documents/*"
    }
  ]
}
```

   Important : la bucket policy de CloudFront ci-dessus doit rester limitee a `media/*`. Avec `/*`, CloudFront pourrait servir les documents prives.

4. Renseigner `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` et `CLOUDFRONT_URL` (localement dans `.env.local`, sur Vercel dans les variables du projet). Ne jamais mettre ces cles dans le code ni dans un chat ; les renouveler en cas de fuite.
5. `CLOUDFRONT_URL` est lue au demarrage et a la construction (`next.config.ts` autorise ce domaine pour `next/image`) : **redeployer apres l'avoir changee**.

Sans cette configuration, l'admin affiche "Stockage d'images indisponible" et les illustrations dessinees restent utilisees. Les visuels du dossier `public/` fonctionnent toujours.

### Documents prives (factures et avoirs)

Le meme bucket archive les PDF sous `documents/invoices/<annee>/` et `documents/credit-notes/<annee>/` (cle avec suffixe aleatoire). Ils ne passent jamais par CloudFront : le site les lit lui-meme (requete S3 signee) apres avoir verifie le jeton de commande ou la session admin. Sans variables `S3_*`, les PDF sont regeneres a la demande depuis la base, a l'identique (les donnees vendeur et client sont figees dans la facture a l'emission). Activer le versioning du bucket est conseille.

## 7. Deploiement (Vercel)

1. Importer le depot dans Vercel.
2. Ajouter toutes les variables du tableau ci-dessus (`SITE_URL` = domaine final).
3. Declarer le webhook Stripe avec le domaine final (section 5).

## 8. Suivi de commande et e-mails

1. Paiement confirme (webhook Stripe) : facture emise (numerotation continue `FA-AAAA-000001`), e-mail de confirmation au client avec la facture en PDF jointe, et alerte a `ADMIN_EMAIL`.
2. Expedition (`/admin/commandes`, transporteur et numero de suivi) : e-mail "commande expediee" avec lien de suivi du transporteur. Livraison : e-mail "commande livree" avec le bordereau de retour.
3. Page de suivi `/commande/<jeton>` : le jeton est aleatoire (144 bits), unique par commande, envoye uniquement par e-mail. Elle affiche le statut avec les dates, les pieces, la TVA, le suivi du colis, la facture, l'avoir et le bordereau de retour (PDF). Fonctionne sans compte client.
4. Retour en stock : e-mail aux personnes inscrites sur la liste d'attente, avec lien de desinscription signe.
5. Remboursement (bouton dans `/admin`) : un avoir `AV-AAAA-000001` est emis et joint a l'e-mail de remboursement.

Statuts : paiement en attente, a expedier, expediee, livree, annulee, expiree, remboursement a faire, remboursee.

### Espace admin (`/admin`)

- Indicateurs : CA 7 j / 30 j / total (TTC), commandes payees, panier moyen, a expedier, remboursements a faire, paiements en attente, ventes par piece, alertes de stock bas (3 pieces ou moins).
- Commandes (`/admin/commandes`) : recherche (numero, nom, e-mail), filtres par statut, page detail par commande (articles, TVA, historique, notes internes jamais visibles du client), expedition avec transporteur et numero de suivi, livraison, annulation des commandes non payees.
- Documents PDF d'une commande : facture, avoir, bon de preparation (colisage, sans prix) et bordereau de retour avec formulaire de retractation. Bouton "Emettre la facture" si une commande payee n'en a pas.
- Societe et factures (`/admin/societe`) : raison sociale, SIRET, RCS, TVA intracommunautaire, adresses, mediateur, mentions de pied de facture, regime de TVA UE, et export CSV mensuel des factures et avoirs pour la comptabilite. Ces informations alimentent aussi les mentions legales et les CGV. Une facture emise n'est jamais modifiee ni supprimee (verrou en base).
- Remboursement : bouton "Rembourser" (remboursement integral via Stripe, avec case "remettre en stock" si le retour est recu). Pour une commande payee, c'est la seule facon de l'annuler ; ne pas rembourser depuis le tableau de bord Stripe pour garder les statuts a jour.
- Stock par taille, et liste d'attente : inscrits par piece et taille, bouton "Prevenir maintenant", retrait d'une adresse.
- Pieces (`/admin/produits`) : creer une piece, modifier nom, prix, tailles, edition, matiere, description, couleurs et illustration, ordre d'affichage ; envoyer ou retirer une photo (PNG, JPEG ou WebP, 3 Mo max, stockee sur S3 et servie par CloudFront) ; archiver ou restaurer (une piece n'est jamais supprimee car les commandes y font reference). Le stock se regle depuis le tableau de bord.
- Looks (dans `/admin/produits`, par piece, 8 max) : photos portees par lieu ou ambiance, ouvertes sur le site au clic sur la piece. Titre, legende, ordre ; images stockees sur S3 sous `media/scene-<slug>/`. Specifications et prompts pour le generateur d'images : `docs/prompts-images.md`.
- Contenu (`/admin/contenu`) : texte des pages Informations (CGV, livraison, retours, mentions, confidentialite, contact), creation de nouvelles pages, retour au texte d'origine, accroche sous le logo, logo (image ou logotype texte). Format des textes : `## Titre` ouvre une section, une ligne vide separe les paragraphes.
- Source de verite : `src/lib/products.ts` et `src/lib/legal.ts` ne servent que de valeurs par defaut. Une modification faite dans l'admin (ligne en base de meme identifiant) remplace la valeur du code ; modifier ensuite le fichier du code n'a plus d'effet sur cette piece ou cette page. Coordonnees de la societe : valeurs par defaut dans `brand.ts`, remplacees par `/admin/societe`.
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
- Stock : reservation atomique en transaction SQL (fonction `create_order`, verrous), sans survente.
- Base : acces serveur uniquement (`service_role`), RLS actif sur toutes les tables, fonctions transactionnelles non executables par `anon`/`authenticated`, entrees validees avec zod, sorties HTML echappees (e-mails).
- Admin `/admin` : Supabase Auth (e-mail + mot de passe), role `admin` dans `app_metadata` verifie aupres de Supabase a chaque requete (`getUser`), limitation a 5 echecs par 15 min et par visiteur, pages non indexees et jamais mises en cache. Toutes les actions admin reverifient le role cote serveur.
- Comptes clients : connexion par code a usage unique envoye par e-mail (pas de mot de passe a voler), reponses identiques que l'adresse existe ou non, limitation de debit par visiteur et par adresse, suppression du compte avec saisie de confirmation.
- Anti-abus : limitation de debit sur la creation de commande (le stock est reserve 30 min) et sur la liste d'attente. Adresses IP et e-mails ne sont stockes que sous forme d'empreinte, purgee apres 2 jours.
- En-tetes HTTP : HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP (anti-framing, formulaires limites a notre domaine et Stripe).
- Envois de photos : formats PNG/JPEG/WebP uniquement, type verifie sur le contenu du fichier, 3 Mo maximum, reserves a l'admin connecte (controle de l'origine de la requete en plus du cookie `SameSite=Strict`). Bucket S3 prive (lecture des images uniquement via CloudFront/OAC sur `media/*`), compte IAM limite a `PutObject`/`DeleteObject` sur `media/` et `PutObject`/`GetObject` sur `documents/`. Factures : numerotation sans trou, immuables (trigger SQL), coherence des montants verifiee avant emission, jamais emises avec des informations societe incompletes ; telechargement par jeton de suivi (limite a 30 documents par minute et par visiteur) ou session admin.
- Secrets uniquement en variables d'environnement (`.env.local` ignore par git).

A faire de votre cote :
- Mot de passe admin : 20 caracteres ou plus, unique (gestionnaire de mots de passe), avec 2FA Supabase si possible. Ne jamais reutiliser un mot de passe.
- Activer la 2FA sur GitHub, Vercel, Stripe, Supabase, AWS et Resend. Proteger la branche principale.
- Renforcer l'acces admin : Vercel Deployment Protection / Cloudflare Access sur `/admin`, ou restriction par IP.
- Verifier SPF, DKIM et DMARC du domaine d'envoi (anti-usurpation).
- Cles Stripe : en production uniquement dans Vercel (jamais dans le code ni dans un chat) ; en cas de fuite, les regenerer.
- Lancer `npm audit` regulierement et garder Next.js a jour.
- Surveiller les journaux Vercel et Supabase ; ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` (pas de prefixe `NEXT_PUBLIC_`).
- Conserver les donnees de commande uniquement la duree legale (obligations comptables) et traiter les demandes RGPD sous un mois.

## 10. A completer avant la mise en ligne

- `/admin/societe` : raison sociale, forme juridique, capital, SIRET, RCS, TVA intracommunautaire, adresse du siege, telephone, directeur de publication, adresse de retour des colis, mediateur de la consommation. Le champ `[...]` encore affiche signale ce qu'il reste a renseigner ; e-mail de contact dans `src/lib/brand.ts`.
- `src/lib/products.ts` : valeurs par defaut des pieces (prix TTC, stocks initiaux, visuels). Apres le premier demarrage, gerer les pieces depuis `/admin/produits`.
- `src/lib/shipping.ts` : frais et delais France / UE.
- `src/lib/legal.ts` : textes par defaut (CGV, livraison, retractation, mentions, confidentialite), modifiables depuis `/admin/contenu`. A faire relire par un juriste.

## 11. Points d'attention

- Les ventes se font depuis la France (stock en France) vers la France et l'UE. Les prix affiches sont TTC et identiques partout ; la facture en extrait la TVA au taux du pays de livraison (guichet unique OSS, taux dans `src/lib/vat.ts`) ou au taux francais sous le seuil de 10 000 EUR de ventes UE (reglage dans `/admin/societe`). Verifier les taux et le regime avec un expert-comptable.
- Un mediateur de la consommation est obligatoire pour vendre a des consommateurs en France.
- Informer l'acheteur du droit de retractation de 14 jours (deja integre au parcours et aux CGV).
- Les commandes peuvent se faire en invite ; un compte client est facultatif (`/compte`). Les commandes sont aussi suivies via `/commande/<jeton>` (lien envoye par e-mail).

## 12. Limites connues

- Remboursements : integraux uniquement (pas de remboursement partiel) ; un remboursement fait depuis le tableau de bord Stripe n'est pas synchronise avec la commande.
- Les prix sont en euros entiers TTC et ne varient pas selon le pays (la TVA est deduite a la facturation) ; pas de frais de livraison au poids.
- Livraison limitee a la France et a l'UE (deux zones forfaitaires).
