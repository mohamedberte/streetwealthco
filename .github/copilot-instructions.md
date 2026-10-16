# TRIPLEX - Copilot instructions

- Brand: TRIPLEX (anciennement StreetWealth Co.).
- Tagline: L'expression d'un style distinctif qui transcende les frontieres.
- Stack: Next.js (App Router), TypeScript, Tailwind CSS, GSAP, npm.
- Concept: site d'une seule page, une exposition immersive en carrousel motion. Pas de menu multi-onglets. Une piece = une scene plein ecran.
- Navigation: molette, glisser, clavier, points d'index. Transitions GSAP (fond, mot geant, piece).
- Tone: refined, editorial, understated luxury streetwear. French-first copy.
- Palette (Tailwind tokens): cream `#E8D8C0`, ivory `#F3EBDD`, brown `#24150F`, brown-soft `#5C493D`, gold `#A9844F`, border `#CDBB9F`, muted `#75685D`, white `#FAF8F3`.
- Gold is accent only. Do not use bright colors or playful UI.
- Donnees des pieces: `src/lib/products.ts` (champ `image` optionnel pour une photo reelle).
- Prefer server components. Keep client components minimal.
- Do not commit secrets. Use `.env.local` for local keys.
- Boutique (vente en France / UE): prix en EUR TTC, stock par taille en base Postgres (src/server), paiement par carte via Stripe Checkout (webhook), commande invite, livraison France + UE (src/lib/shipping.ts), droit de retractation 14 jours. Textes legaux dans src/lib/legal.ts, infos societe dans src/lib/brand.ts. Voir SETUP.md.
- Police Bebas Neue reservee au logo (composant Logo).
