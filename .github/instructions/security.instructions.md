---
description: "Regles de securite TRIPLEX pour le code serveur, les server actions, les routes API, l'admin et la config Next.js. Use when editing src/server, actions.ts, route.ts, admin or next.config.ts."
applyTo: "src/server/**,src/app/**/actions.ts,src/app/**/content-actions.ts,src/app/**/route.ts,src/app/admin/**,src/app/api/**,next.config.ts"
---
# Securite - regles a respecter a chaque modification

## Authentification (admin et clients)
- Supabase Auth (`@supabase/ssr`, session en cookies rafraichie par `src/proxy.ts`). Le role admin est `app_metadata.role = 'admin'` : jamais `user_metadata` (modifiable par l'utilisateur).
- L'identite se verifie avec `currentUser()` (`auth.getUser()`, validee par Supabase), jamais avec le simple contenu du cookie ni `getSession()`.
- Toute server action et tout route handler sous `/admin` appelle `requireAdmin()` / `isAdmin()` en premier, avant toute lecture ou ecriture. Une page admin non connectee affiche le formulaire de connexion.
- Un POST hors server action (route handler) verifie en plus l'en-tete `Origin` (meme hote).
- Les logins (admin et clients) restent limites (`isLimited`). Les formulaires de compte ne revelent pas si une adresse existe. Redirections (`/auth/confirm`) uniquement vers un chemin interne.
- Le client Supabase `db()` utilise la cle `service_role` (contourne le RLS) : serveur uniquement, apres verification des droits ; le RLS reste actif sur toutes les tables en defense en profondeur. Les fonctions SQL transactionnelles ne sont executables que par `service_role`.

## Entrees et base de donnees
- Toute entree (FormData, JSON, query, params) est validee avec zod ou une regex stricte, avec des bornes de longueur. Jamais de confiance dans un champ cache.
- Acces aux donnees via supabase-js (requetes parametrees par construction) ou fonctions SQL `rpc`. Aucun SQL construit par concatenation de valeurs utilisateur, y compris dans les filtres `.or()` / `.ilike()`.
- Pas de `select("*")` sur des tables contenant des secrets ou des donnees personnelles renvoyees au client : liste explicite de colonnes.
- Les prix, noms et tailles d'une commande sont toujours recalcules cote serveur depuis le catalogue (`src/server/catalog.ts`), jamais lus depuis le client.

## Fichiers et medias
- Upload : liste blanche PNG/JPEG/WebP, type verifie sur les octets (`sniffImage`), taille plafonnee, cle de media validee par regex (`logo`, `product-<slug>`, `scene-<slug>`). Les images des looks suivent les memes controles et le nombre de looks par piece est plafonne (`MAX_SCENES`). Jamais de SVG ni de HTML.
- Les medias sont servis par CloudFront depuis un bucket S3 prive (OAC, pas d'ACL publique). Le compte IAM du site est limite a `PutObject`/`DeleteObject` sur le prefixe `media/`. Cles `S3_*` uniquement en variables d'environnement, jamais journalisees (ne logger que le statut des erreurs S3). Les objets ont une cle versionnee (cache immuable) ; la suppression ne vise que les cles valides par regex.

## Secrets et donnees personnelles
- Aucun secret dans le code, les logs ni les reponses. Variables dans `.env.local` / Vercel uniquement ; `.env.example` ne contient que des exemples vides.
- Les logs ne contiennent ni e-mail, ni adresse, ni telephone, ni jeton de commande. Les IP ne sont stockees que hachees (`rate-limit.ts`).
- Les fichiers `src/server/**` commencent par `import "server-only"`.

## Paiement
- Le webhook Stripe verifie la signature sur le corps brut avant tout traitement et reste idempotent (rejeu possible).
- Les montants envoyes a Stripe viennent de la commande en base, jamais du client.

## En-tetes et exposition
- `next.config.ts` conserve : HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP, `X-Robots-Tag: noindex` + `no-store` sur `/admin/*` et `/commande/*`, `poweredByHeader: false`.
- Pas de rendu HTML brut a partir d'un texte editable (`dangerouslySetInnerHTML` interdit). Le contenu des pages editables est rendu comme texte.
- Messages d'erreur renvoyes a l'utilisateur : generiques. Le detail va dans `console.error` sans donnee personnelle.

## Avant de conclure une modification
Lancer le prompt `/security-audit` (ou l'agent Security Auditor) si la modification touche l'authentification, les paiements, les uploads, le SQL ou les en-tetes.
