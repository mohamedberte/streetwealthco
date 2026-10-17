# TRIPLEX

L'expression d'un style distinctif qui transcende les frontieres.

Site d'une seule page : une exposition immersive en carrousel motion (Next.js App Router, TypeScript, Tailwind CSS, GSAP), avec une boutique complete pour la vente en France et dans l'UE (prix en EUR TTC, paiement par carte via Stripe Checkout, stock par taille en PostgreSQL (Supabase), comptes clients facultatifs et admin via Supabase Auth, images sur AWS S3 + CloudFront, droit de retractation de 14 jours).

## Demarrage rapide

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Installation complete, configuration (Supabase, Stripe, Resend, AWS, Vercel), elements a completer et limites : voir [SETUP.md](SETUP.md).

## Structure

- `src/app` : pages, actions serveur, webhook Stripe (`api/stripe/webhook`), espace `/admin`, comptes clients `/compte`, suivi `/commande/<jeton>`
- `supabase/migrations` : schema SQL, fonctions transactionnelles et RLS (a executer dans Supabase)
- `src/components` : exposition, panier, paiement
- `src/lib` : pieces (`products.ts`), livraison (`shipping.ts`), societe (`brand.ts`), textes legaux (`legal.ts`)
- `src/server` : base de donnees, stock, commandes, paiements, e-mails
