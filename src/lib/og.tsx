import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import type { Product } from "@/lib/products";

/** Palette de la marque (mêmes valeurs que les tokens Tailwind). */
const color = { cream: "#E8D8C0", ivory: "#F3EBDD", brown: "#24150F", gold: "#A9844F" };

export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * Pictogramme TRIPLEX : un T crème sur fond brun, souligné d'un filet or.
 * Dessiné en formes simples (aucune police) pour un rendu identique partout.
 * `inset` réserve une marge de sécurité (icônes « maskable », coins arrondis iOS).
 */
export function markImage(size: number, inset = 0) {
  const offset = size * inset;
  const unit = (size - offset * 2) / 64;
  const rect = (x: number, y: number, w: number, h: number, background: string) => ({
    position: "absolute" as const,
    left: offset + x * unit,
    top: offset + y * unit,
    width: w * unit,
    height: h * unit,
    background,
  });

  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: size, height: size, background: color.brown }}>
        <div style={rect(14, 16, 36, 8, color.cream)} />
        <div style={rect(28, 24, 8, 26, color.cream)} />
        <div style={rect(22, 54, 20, 2, color.gold)} />
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}

/** Aperçu de partage de la page d'accueil (1200 × 630). */
export function brandCard() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 80,
          background: color.brown,
          color: color.ivory,
        }}
      >
        <div style={{ display: "flex", width: 96, height: 2, background: color.gold }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 168, letterSpacing: "0.22em", color: color.cream }}>
            {brand.name}
          </div>
          <div style={{ display: "flex", marginTop: 28, maxWidth: 860, fontSize: 32, lineHeight: 1.4, opacity: 0.75 }}>
            {brand.tagline}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.34em", color: color.gold }}>
          EXPOSITION
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}

/**
 * Aperçu de partage d'une pièce : fond et encre de la pièce, nom, prix et photo si elle existe
 * (`photo` = data URI PNG ou JPEG).
 */
export function productCard(product: Product, photo: string | null) {
  const { tone } = product;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          background: tone.bg,
          color: tone.ink,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: -40,
            display: "flex",
            fontSize: 300,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            opacity: 0.07,
          }}
        >
          {product.word}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: photo ? 660 : 1200,
            height: "100%",
            padding: 72,
          }}
        >
          <div style={{ display: "flex", fontSize: 26, letterSpacing: "0.4em", opacity: 0.7 }}>{brand.name}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", width: 72, height: 2, background: tone.accent ?? color.gold }} />
            <div style={{ display: "flex", marginTop: 32, fontSize: 76, lineHeight: 1.05 }}>{product.name}</div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 30, letterSpacing: "0.08em" }}>
              {`${product.price} €  ·  Édition ${product.edition}`}
            </div>
            <div style={{ display: "flex", marginTop: 14, fontSize: 22, letterSpacing: "0.22em", opacity: 0.6 }}>
              {product.silhouette.toUpperCase()}
            </div>
          </div>
        </div>

        {photo && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 540, height: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={photo} width={500} height={560} style={{ objectFit: "contain" }} />
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
