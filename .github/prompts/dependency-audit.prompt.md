---
description: "Audit des dependances npm : vulnerabilites, paquets obsoletes ou inutiles, changements majeurs"
agent: "Release Reviewer"
---
Audite les dependances du projet.

1. Lance `npm audit` et `npm outdated` (lecture seule, sans rien installer ni mettre a jour).
2. Pour chaque vulnerabilite : paquet, gravite, chemin, exploitable ou non dans ce projet (dependance directe, code serveur ou outil de build), correctif disponible.
3. Releve les paquets declares dans `package.json` mais jamais importes, et les paquets a risque (non maintenus, tres peu utilises).
4. Pour `next` et `react` : indique les versions de securite a viser et rappelle de lire les notes de version (`node_modules/next/dist/docs/` pour Next.js) avant toute montee de version majeure.
5. Termine par un plan de mise a jour ordonne, du plus urgent au moins urgent, sans l'appliquer.
