# TRIPLEX — Copilot instructions

- Brand: TRIPLEX (anciennement StreetWealth Co.).
- Tagline: L'expression d'un style distinctif qui transcende les frontières.
- Stack: Next.js (App Router), TypeScript, Tailwind CSS, GSAP, npm.
- Concept: site d'une seule page, une exposition immersive en carrousel motion. Pas de menu multi-onglets. Une pièce = une scène plein écran.
- Navigation: molette, glisser, clavier, points d'index. Transitions GSAP (fond, mot géant, pièce).
- Tone: refined, editorial, understated luxury streetwear. French-first copy.
- Palette (Tailwind tokens): cream `#E8D8C0`, ivory `#F3EBDD`, brown `#24150F`, brown-soft `#5C493D`, gold `#A9844F`, border `#CDBB9F`, muted `#75685D`, white `#FAF8F3`.
- Gold is accent only. Do not use bright colors or playful UI.
- Données des pièces: `src/lib/products.ts` (champ `image` optionnel pour une photo réelle).
- Prefer server components. Keep client components minimal.
- Do not commit secrets. Use `.env.local` for local keys.
