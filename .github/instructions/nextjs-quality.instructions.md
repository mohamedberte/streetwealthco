---
description: "Conventions de qualite Next.js 16 / React 19 / TypeScript pour TRIPLEX. Use when editing pages, components, server code or config in src/."
applyTo: "src/**/*.ts,src/**/*.tsx"
---
# Qualite du code

- Cette version de Next.js a des changements incompatibles : avant d'utiliser une API Next.js peu familiere, lire le guide correspondant dans `node_modules/next/dist/docs/` (voir `AGENTS.md`) et respecter les avis de depreciation.
- Composants serveur par defaut. `"use client"` uniquement pour l'interactivite (carrousel, panier, formulaires dynamiques). Un composant client ne recoit que des donnees serialisables et jamais de secret.
- Un fichier `"use server"` n'exporte que des fonctions async. Les helpers partages vivent dans `src/server/`.
- Les donnees metier editables (pieces, pages, reglages, logo) viennent de la base via `src/server/catalog.ts` et `src/server/content.ts`. Ne plus importer `products` / `legalPages` directement hors de ces deux fichiers (ce sont des valeurs par defaut).
- Typage strict : pas de `any`, pas de `as` sauf justification ; valider aux frontieres (formulaires, JSON, webhooks) avec zod.
- Accessibilite : labels de formulaires associes, `aria-label` sur les boutons-icones, respect de `prefers-reduced-motion`, contraste suffisant.
- Style : tokens Tailwind de la palette TRIPLEX uniquement, or en accent, pas de couleur vive. Bebas Neue reservee au logo.
- Textes visibles en francais, sobres, montants en EUR TTC via `formatPrice`.
- Ne pas ajouter de dependance sans raison ; verifier qu'elle est maintenue et sans vulnerabilite connue (`/dependency-audit`).
- Pas de code mort, pas de commentaire qui repete le code ; commenter le « pourquoi » des choix non evidents.
