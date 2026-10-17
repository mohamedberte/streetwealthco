# TRIPLEX — Guide de prompts pour les visuels

Ce guide donne les instructions à fournir à un générateur d'images (Midjourney, GPT-Image, Flux, Firefly, Gemini…) pour obtenir des visuels qui s'intègrent au carrousel et à la vue « Looks » du site. Les blocs de prompt sont en anglais (meilleurs résultats), le reste en français.

Deux types de visuels :

| Type | Où il apparaît | Dans l'admin |
| --- | --- | --- |
| **A. Visuel carrousel** (pièce détourée) | Scène plein écran de la pièce, devant le mot géant | `/admin/produits` > pièce > **Photo** |
| **B. Looks** (pièce portée, lieux différents) | Clic sur la pièce ou « Voir les looks » : galerie plein écran animée | `/admin/produits` > pièce > **Looks** (8 maximum) |

Le site fournit le mouvement (flottement, parallaxe, zoom lent, voile entre les looks). Il suffit de générer de **belles images fixes**, bien cadrées.

---

## 1. Spécifications techniques

### A. Visuel carrousel

| Point | Valeur |
| --- | --- |
| Format | **5:6 portrait** (ex. 2000 × 2400 px) |
| Fichier | **PNG à fond transparent** (WebP accepté), 3 Mo maximum |
| Cadrage | Pièce **centrée**, de face, occupant ~85 % de la hauteur, marge régulière autour |
| Fond | Aucun : le site affiche sa couleur de fond et le mot géant derrière la pièce |
| Ombre | Aucune ombre portée au sol ni horizon (la pièce « flotte » et bouge légèrement) |
| Rendu | Pièce à plat ou sur mannequin invisible (« ghost mannequin »), lumière douce |

Pourquoi transparent : chaque pièce a sa couleur de fond (voir tableau §4). Un fond uni généré par l'IA ne correspondrait jamais exactement et laisserait un rectangle visible.

Flux conseillé : générer sur fond uni neutre → détourer (Photoshop / Firefly / outil de détourage) → exporter en PNG transparent → ajouter si besoin une ombre très douce et diffuse **intégrée à la pièce** (pas au sol).

### B. Looks (pièce portée)

| Point | Valeur |
| --- | --- |
| Format | **3:2 paysage** (ex. 2400 × 1600 px) |
| Fichier | JPEG ou WebP, qualité 80-85, sRGB, **3 Mo maximum** (PNG accepté mais lourd) |
| Cadrage | Mannequin **en pied**, **centré** : tête et pieds dans les 70 % centraux en hauteur, corps dans les 30 % centraux en largeur |
| Zone calme | Garder le **bas gauche dégagé** (le titre du look s'y affiche) |
| Texte | Aucun texte, aucun logo ajouté, aucune légende dans l'image |

Pourquoi ce cadrage : sur ordinateur (16:9) l'image est rognée en haut et en bas ; sur téléphone (portrait) elle est rognée sur les côtés, il ne reste que le tiers central. Tout ce qui est important (visage, pièce, chaussures) doit donc rester au centre.

---

## 2. Direction artistique commune

- Marque : **TRIPLEX**, streetwear de luxe discret, éditorial, sobre. Pas d'effet, pas de gadget.
- Palette : crème `#E8D8C0`, ivoire `#F3EBDD`, brun `#24150F`, brun doux `#5C493D`, sable `#CDBB9F`, or `#A9844F` en accent seulement. Pas de couleur vive.
- Lumière : douce, naturelle, directionnelle, contrastes maîtrisés, ombres profondes mais lisibles. Heure dorée ou lumière de studio diffuse.
- Ambiance : calme, confiante, intemporelle. Poses naturelles, regards souvent détournés ou neutres, aucun sourire publicitaire.
- Matières : le molleton est dense et mat, le jersey sobre, le sergé structuré. Plis réalistes, pas de brillance plastique.
- Grain : léger grain argentique, jamais de rendu « 3D lisse » ou « illustration ».

### Bloc « style maître » (à coller à la fin de chaque prompt)

```
Refined editorial fashion photography, understated luxury streetwear, warm earthy palette
(cream, ivory, deep brown, sand, a touch of muted gold), soft natural directional light,
subtle film grain, true-to-life fabric texture, calm confident mood, no text, no logo,
no watermark, photorealistic, high detail, 85mm lens, shallow depth of field
```

### Bloc « à éviter » (prompt négatif ou « exclure »)

```
text, letters, watermark, extra logos, extra fingers, deformed hands, distorted face,
plastic sheen, oversaturated colors, neon, cartoon, illustration, 3D render look,
wrinkled cheap fabric, wrong garment shape, extra pockets, extra drawstrings,
busy background, heavy vignette, harsh flash
```

---

## 3. Prompts types

Remplacer les `{variables}` par les valeurs de la pièce (tableau §4).

### A. Visuel carrousel (pièce détourable)

```
Front view product photograph of a {GARMENT_DESCRIPTION} in {GARMENT_COLOR}, ghost mannequin
(invisible mannequin) effect, centered, symmetrical, full garment visible with a clean margin
around it, plain flat light grey seamless background, soft diffused studio light, no floor,
no cast shadow, crisp fabric detail ({FABRIC}), {DETAIL}.
Aspect ratio 5:6. Refined editorial product photography, true-to-life color and texture,
no text, no logo, no watermark.
```

Midjourney : ajouter `--ar 5:6 --style raw`. Autres outils : choisir le format « portrait 5:6 » ou le plus proche (4:5), puis recadrer.

Variantes à générer pour choisir : de face, légèrement de trois quarts (le site incline déjà la pièce avec la souris), détail du col ou de la broderie en gros plan (à ajouter comme look).

### B. Look porté (un lieu = un look)

```
Full-body editorial photograph of a {MODEL_DESCRIPTION} wearing a {GARMENT_DESCRIPTION} in
{GARMENT_COLOR}, {OUTFIT_REST}. {POSE}. Location: {LOCATION}. {LIGHT}.
Model centered in the frame, full body visible head to toe with generous space around,
open and quiet composition, lower left of the frame kept calm and uncluttered.
Aspect ratio 3:2. [style maître]
```

Variables fréquentes :

- `MODEL_DESCRIPTION` : toujours la **même description** d'un look à l'autre (voir §5 cohérence).
- `OUTFIT_REST` : reste de la tenue sobre et neutre (pantalon ou haut ton sur ton, baskets minimalistes), pour que la pièce reste le sujet.
- `POSE` : `standing relaxed, hands in pockets, looking away from camera` / `walking slowly, mid-stride` / `seated on concrete steps, leaning forward`.

### Lieux suggérés (un look chacun, titre à saisir dans l'admin)

| Titre du look (admin) | `LOCATION` + `LIGHT` |
| --- | --- |
| Plateau, heure dorée | `modern glass and concrete towers of a West African business district, wide empty plaza` + `golden hour, long warm shadows` |
| Cocody, béton chaud | `modernist villa with warm raw concrete walls and a few bougainvillea branches` + `late afternoon sun, soft contrast` |
| Assinie, bord de mer | `quiet beach at dawn, calm sea, faint haze, a single palm trunk at the edge` + `soft cool-warm morning light` |
| Atelier, lumière du matin | `tailor's workshop, linen, wooden table, hanging fabric rolls, large window` + `soft north window light` |
| Paris, Palais-Royal | `stone arcades of a Parisian garden, overcast sky, pale gravel` + `soft overcast light` |
| Toit, la nuit | `rooftop at night, city lights as out-of-focus warm bokeh` + `warm practical lights, deep brown shadows` |
| Studio, fond crème | `seamless cream studio backdrop #E8D8C0, no props` + `soft large softbox from the left` |

Chaque pièce peut avoir de 3 à 8 looks. Alterner plan large, plan en pied et un détail (broderie, col, matière) pour donner du rythme à la lecture automatique.

### « Prototypes » et variantes

Pour montrer plusieurs prototypes ou coloris d'une même pièce, générer **le même look** avec la pièce dans un autre coloris (même modèle, même lieu, même pose) et l'ajouter comme look distinct, titre par exemple « Prototype 02 — brun profond ».

---

## 4. Données par pièce (catalogue par défaut)

| Pièce | Fond du site | Couleur de la pièce | `GARMENT_DESCRIPTION` | `FABRIC` / `DETAIL` |
| --- | --- | --- | --- | --- |
| Hoodie Cropped Ivoire | `#24150F` | ivoire `#F3EBDD` | cropped boxy hoodie, deep hood, kangaroo pocket, ribbed hem | heavy 480 gsm cotton fleece / tone-on-tone embroidered signature |
| Hoodie Oversized Crème | `#5C493D` | crème `#E8D8C0` | oversized hoodie, dropped shoulders, kangaroo pocket | heavy 520 gsm cotton fleece / relaxed drape |
| Tee Essentiel Brun | `#E8D8C0` | brun doux `#5C493D` | classic boxy crew neck t-shirt | dense 220 gsm cotton jersey / clean neckline |
| Sweat Col Rond Ivoire | `#CDBB9F` | ivoire `#F3EBDD` | crewneck sweatshirt, ribbed collar and cuffs | 460 gsm cotton fleece / no visible logo |
| Pantalon Relaxed | `#F3EBDD` | brun profond `#24150F` | relaxed straight-leg trousers, soft pleats | 320 gsm cotton twill / soft drape |
| Casquette Signature | `#1A0F0A` | crème `#E8D8C0` | six-panel cap with a firm brim | cotton twill / small embroidery in muted gold `#A9844F` |

Pour une nouvelle pièce créée dans l'admin : reprendre la **couleur de fond** et la **couleur de la pièce** saisies dans le formulaire.

Contraste : le visuel carrousel doit se détacher du fond de la scène. Si la pièce est proche du fond (ex. brun sur brun), ajuster les couleurs dans l'admin plutôt que de forcer l'image.

---

## 5. Cohérence entre les images

- **Même modèle partout** : utiliser une image de référence du mannequin (référence de personnage : Midjourney `--cref`, GPT-Image / Gemini « image de référence », Flux Kontext) et garder la même description écrite.
- **Même pièce partout** : partir d'une vraie photo du prototype ou d'un plat de la pièce comme image de référence ; décrire seulement ce qui doit changer (lieu, pose, lumière). Sans référence, l'IA invente des coutures, poches et cordons.
- **Même grade couleur** : ajouter une image de référence de style (`--sref` ou équivalent) construite à partir de 2-3 looks déjà validés.
- Garder le même objectif (85 mm) et la même distance pour les plans en pied.

---

## 6. Contrôle qualité avant envoi (checklist)

- [ ] Pièce **fidèle au prototype réel** : couleur, coupe, longueur, proportions, broderies, poches, cordons.
- [ ] Aucun texte, logo parasite ou filigrane dans l'image.
- [ ] Mains, visage, pieds et plis du tissu sans défaut visible (zoomer à 100 %).
- [ ] Sujet dans la zone sûre (§1) : visuel carrousel centré, look centré avec bas gauche dégagé.
- [ ] Carrousel : PNG transparent, bords propres (pas de halo clair ou sombre).
- [ ] Look : JPEG/WebP ≤ 3 Mo, 2400 px de large, sRGB.
- [ ] Teinte de la pièce cohérente avec la couleur annoncée sur le site.
- [ ] Nom de fichier explicite (ex. `hoodie-cropped-ivoire-plateau.jpg`) ; titre court dans l'admin (« Plateau, heure dorée »), légende de 200 caractères maximum.

---

## 7. Conformité et droits

- **Fidélité au produit** : un acheteur ne doit jamais recevoir une pièce différente de celle montrée. Les visuels générés doivent rester conformes au produit réel (couleur, matière, coupe). En cas de doute, refaire l'image à partir d'une photo réelle.
- **Mention IA** : si les photos de mannequins sont générées par IA, l'indiquer (par exemple dans les Mentions légales via `/admin/contenu`) et faire valider la formulation par un juriste, les règles de transparence européennes sur les contenus générés évoluent.
- **Droits** : vérifier que la licence de l'outil autorise l'usage commercial ; ne pas imiter une personne réelle ni citer de marque, de lieu protégé ou d'artiste dans les prompts.
- **Représentation** : choisir des mannequins variés et valorisants, sans stéréotype ; privilégier des lieux et ambiances élégants et crédibles.

---

## 8. Mise en ligne

1. Vérifier que le stockage d'images est configuré (S3 + CloudFront, voir `SETUP.md` §6 bis).
2. `/admin/produits` > ouvrir la pièce.
3. **Photo** : envoyer le PNG transparent (visuel carrousel).
4. **Looks** : pour chaque scène, saisir le titre (lieu ou ambiance), la légende, choisir le fichier puis « Ajouter le look ». L'ordre se règle avec le champ « Ordre ».
5. Sur le site, cliquer sur la pièce (ou « Voir les looks ») pour contrôler le rendu sur ordinateur et sur téléphone.
