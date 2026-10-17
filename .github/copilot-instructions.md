# TRIPLEX - Copilot instructions

- Brand: TRIPLEX (anciennement StreetWealth Co.).
- Tagline: L'expression d'un style distinctif qui transcende les frontieres.
- Stack: Next.js (App Router), TypeScript, Tailwind CSS, GSAP, npm.
- Concept: site d'une seule page, une exposition immersive en carrousel motion. Pas de menu multi-onglets. Une piece = une scene plein ecran.
- Navigation: molette, glisser, clavier, points d'index. Transitions GSAP (fond, mot geant, piece).
- Tone: refined, editorial, understated luxury streetwear. French-first copy.
- Palette (Tailwind tokens): cream `#E8D8C0`, ivory `#F3EBDD`, brown `#24150F`, brown-soft `#5C493D`, gold `#A9844F`, border `#CDBB9F`, muted `#75685D`, white `#FAF8F3`.
- Gold is accent only. Do not use bright colors or playful UI.
- Donnees des pieces: la base Supabase (Postgres) fait foi (table `products`, gerees dans `/admin/produits`) ; `src/lib/products.ts` ne contient que les valeurs par defaut. Acces via `src/server/catalog.ts`. Meme principe pour les pages Informations (`src/server/content.ts`, defauts dans `src/lib/legal.ts`), l'accroche et le logo. Photos et logo: bucket S3 prive + CloudFront (`src/server/media.ts`, SigV4 sans SDK, variables `S3_*` et `CLOUDFRONT_URL`), URL stockee en base.
- Looks: chaque piece peut avoir jusqu'a 8 scenes portees (table `product_scenes`, composant `Lookbook`, ouvert au clic sur la piece). Specs et prompts du generateur d'images: `docs/prompts-images.md`.
- Prefer server components. Keep client components minimal.
- Do not commit secrets. Use `.env.local` for local keys.
- Boutique (vente en France / UE): prix en EUR TTC, stock par taille en base Supabase (src/server, client `db()` service_role cote serveur uniquement, schema et fonctions SQL dans `supabase/migrations`), auth Supabase (admin = `app_metadata.role = 'admin'`, comptes clients facultatifs sous `/compte`, session rafraichie par `src/proxy.ts`), paiement par carte via Stripe Checkout (webhook), commande invite ou connectee, livraison France + UE (src/lib/shipping.ts), droit de retractation 14 jours. Textes legaux dans src/lib/legal.ts, infos societe dans src/lib/brand.ts. Voir SETUP.md.
- Police Bebas Neue reservee au logo (composant Logo).
- Controles permanents: avant de livrer, lancer `/pre-release-check` ; apres toute modification de l'admin, du paiement, des uploads, du SQL ou des en-tetes, lancer `/security-audit`. Agents: Security Auditor, Release Reviewer. Regles detaillees dans `.github/instructions/`.
- Next.js a des changements incompatibles : lire `node_modules/next/dist/docs/` avant d'utiliser une API peu connue (voir AGENTS.md).
