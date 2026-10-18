import { markImage } from "@/lib/og";

/** /favicon.ico : fichier ICO contenant une image PNG 48 × 48 (lu par les anciens navigateurs et les robots). */
export async function GET() {
  const png = Buffer.from(await markImage(48).arrayBuffer());
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // réservé
  header.writeUInt16LE(1, 2); // type : icône
  header.writeUInt16LE(1, 4); // une image
  header.writeUInt8(48, 6); // largeur
  header.writeUInt8(48, 7); // hauteur
  header.writeUInt16LE(1, 10); // plans
  header.writeUInt16LE(32, 12); // bits par pixel
  header.writeUInt32LE(png.length, 14); // taille des données
  header.writeUInt32LE(22, 18); // décalage des données
  return new Response(Buffer.concat([header, png]), {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
