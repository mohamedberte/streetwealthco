---
description: "Lance un audit de securite complet du site TRIPLEX avec l'agent Security Auditor"
agent: "Security Auditor"
argument-hint: "Perimetre optionnel (par defaut : toute l'application)"
---
Realise un audit de securite du perimetre indique (par defaut : toute l'application, `src/` et `next.config.ts`).

Points obligatoires :
- Authentification et autorisation admin (server actions, route handlers, pages).
- Paiement et webhook Stripe : signature, idempotence, montants issus de la base.
- Commandes, stock et remboursements : course critique, double soumission, rejeu.
- Uploads de medias, rendu des contenus editables (XSS), liens signes.
- SQL, validation des entrees, limitation de debit, fuites de donnees dans les reponses et les logs.
- En-tetes de securite, CSP, `noindex`, secrets et dependances.

Compare l'etat actuel aux regles de [security.instructions.md](../instructions/security.instructions.md) et signale tout ecart, y compris les regles devenues obsoletes. Termine par la liste priorisee des correctifs.
