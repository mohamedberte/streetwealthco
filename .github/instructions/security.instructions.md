---
description: "Regles de securite TRIPLEX pour le code serveur, les server actions, les routes API, l'admin et la config Next.js. Use when editing src/server, actions.ts, route.ts, admin or next.config.ts."
applyTo: "src/server/**,src/app/**/actions.ts,src/app/**/content-actions.ts,src/app/**/route.ts,src/app/admin/**,src/app/api/**,next.config.ts"
---
# Securite - regles a respecter a chaque modification

## Authentification admin
- Toute server action et tout route handler sous `/admin` appelle `requireAdmin()` / `isAdmin()` en premier, avant toute lecture ou ecriture. Une page admin non connectee redirige vers `/admin`.
- Le cookie `triplex_admin` reste `HttpOnly`, `SameSite=Strict`, `Secure` en production, `path=/admin`. Un route handler qui a besoin de la session doit donc vivre sous `/admin`.
- Un POST hors server action (route handler) verifie en plus l'en-tete `Origin` (meme hote).
- Le login reste limite (`isLimited`), avec comparaison a temps constant. `ADMIN_SESSION_SECRET` >= 32 caracteres.

## Entrees et base de donnees
- Toute entree (FormData, JSON, query, params) est validee avec zod ou une regex stricte, avec des bornes de longueur. Jamais de confiance dans un champ cache.
- SQL uniquement parametre (`$1, $2`). Aucune concatenation de valeurs utilisateur. Les seuls fragments dynamiques autorises sont des constantes du code.
- Pas de `select *` sur des tables contenant des secrets ou des donnees personnelles renvoyees au client : liste explicite de colonnes.
- Les prix, noms et tailles d'une commande sont toujours recalcules cote serveur depuis le catalogue (`src/server/catalog.ts`), jamais lus depuis le client.

## Fichiers et medias
- Upload : liste blanche PNG/JPEG/WebP, type verifie sur les octets (`sniffImage`), taille plafonnee, cle de media validee par regex. Jamais de SVG ni de HTML.
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
