---
description: "Controle complet avant mise en production : lint, types, build, revue du code modifie et checklist boutique"
agent: "Release Reviewer"
argument-hint: "Perimetre optionnel (par defaut : changements recents)"
---
Prepare une mise en production de TRIPLEX.

1. Lance `npm run lint`, `npx tsc --noEmit` puis `npm run build` et rapporte les erreurs.
2. Relis les changements recents (ou le perimetre indique) selon [nextjs-quality.instructions.md](../instructions/nextjs-quality.instructions.md).
3. Verifie la checklist de conformite de [shop-compliance.instructions.md](../instructions/shop-compliance.instructions.md) : plus aucun placeholder `[...]` dans `src/lib/brand.ts`, textes legaux relus par un juriste, prix et frais en EUR TTC.
4. Verifie la configuration de deploiement decrite dans [SETUP.md](../../SETUP.md) : variables d'environnement presentes, `SITE_URL` definie, webhook Stripe configure, domaine d'envoi Resend verifie.
5. Conclus par un verdict (pret / reserves / non pret) et la liste des parcours a tester a la main : commande de bout en bout en mode test Stripe, remboursement, liste d'attente, creation d'une piece et modification d'une page depuis l'admin.
