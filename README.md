# StreetWealth Co.

Site vitrine et boutique privée de StreetWealth Co.

**L'expression d'un style distinctif qui transcende les frontières.**

## Démarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Boutique privée

Les routes `/boutique` sont protégées par un code d'accès.

En local, le code par défaut est `STREETWEALTH` (variable `BOUTIQUE_ACCESS_CODE` dans `.env.local`).

En production, définissez un code long et unique. Sans cette variable, l'accès est refusé.

## Pages

| Route | Rôle |
| --- | --- |
| `/` | Vitrine |
| `/maison` | Manifeste |
| `/collections` | Aperçu public |
| `/contact` | Atelier |
| `/acces` | Porte d'entrée |
| `/boutique` | Catalogue privé |
| `/boutique/[slug]` | Fiche pièce |

Le panier est local (navigateur). Le paiement n'est pas encore branché.

## Palette

Crème `#E8D8C0`, ivoire `#F3EBDD`, brun `#24150F`, brun doux `#5C493D`, or `#A9844F` (accent uniquement).
