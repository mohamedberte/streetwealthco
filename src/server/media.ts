import "server-only";
import { DOCUMENTS_PREFIX, readS3Config, s3Request, type S3Config } from "./s3";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export type ImageType = "image/png" | "image/jpeg" | "image/webp";

/** Détecte le vrai format à partir des octets (le type annoncé par le client n'est pas fiable). */
export function sniffImage(data: Uint8Array): ImageType | null {
  const startsWith = (...bytes: number[]) => bytes.every((byte, i) => data[i] === byte);
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Stockage des images : bucket S3 privé, servi au public uniquement par CloudFront (préfixe `media/`).
 * Les requêtes S3 signées sont dans ./s3.ts. Variables : celles de S3, plus CLOUDFRONT_URL
 * (https://...) et S3_PREFIX (optionnel, défaut `media`).
 */

/** Clés autorisées : `logo`, `product-<slug>` ou `scene-<slug>` (a-z, 0-9, tirets). */
export const MEDIA_KEY = /^(logo|(product|scene)-[a-z0-9-]{1,80})$/;

const EXTENSIONS: Record<ImageType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type MediaConfig = S3Config & { baseUrl: string; prefix: string };

function readConfig(): MediaConfig | null {
  const base = readS3Config();
  const baseUrl = process.env.CLOUDFRONT_URL?.trim().replace(/\/+$/, "");
  const prefix = (process.env.S3_PREFIX?.trim() || "media").replace(/^\/+|\/+$/g, "");

  if (!base || !baseUrl) return null;
  if (!/^[a-z0-9][a-z0-9/_-]{0,60}$/i.test(prefix)) return null;
  // Le dossier des documents privés ne doit jamais devenir public.
  if (prefix === DOCUMENTS_PREFIX || prefix.startsWith(`${DOCUMENTS_PREFIX}/`)) return null;
  if (!baseUrl.startsWith("https://")) return null;
  return { ...base, baseUrl, prefix };
}

/** Vrai si le stockage d'images est configuré (sinon l'envoi de photos est refusé proprement). */
export function isMediaConfigured() {
  return readConfig() !== null;
}

/**
 * Envoie l'image dans S3 sous une clé versionnée (`media/<clé>/<horodatage>.<ext>`) et renvoie
 * l'URL CloudFront. La clé change à chaque envoi : cache long et immuable, aucune invalidation.
 */
export async function uploadMedia(key: string, contentType: ImageType, data: Buffer): Promise<string> {
  const config = readConfig();
  if (!config) throw new Error("Stockage d'images non configuré.");
  if (!MEDIA_KEY.test(key)) throw new Error("Clé de média invalide.");

  const objectKey = `${config.prefix}/${key}/${Date.now()}.${EXTENSIONS[contentType]}`;
  await s3Request(config, "PUT", objectKey, data, {
    "cache-control": "public, max-age=31536000, immutable",
    "content-type": contentType,
  });
  return `${config.baseUrl}/${objectKey}`;
}

/**
 * Supprime l'objet correspondant à une URL CloudFront de ce site (ignore les autres URL, par
 * exemple les visuels locaux). Sans effet bloquant : un échec laisse seulement un fichier orphelin.
 */
export async function deleteMediaByUrl(url: string | null | undefined) {
  const config = readConfig();
  if (!config || !url || !url.startsWith(`${config.baseUrl}/${config.prefix}/`)) return;

  const objectKey = url.slice(config.baseUrl.length + 1);
  // Le préfixe ne contient que [A-Za-z0-9/_-] (voir readConfig) : pas de caractère spécial de regex.
  const valid = new RegExp(`^${config.prefix}/(logo|(product|scene)-[a-z0-9-]{1,80})/\\d+\\.(png|jpg|webp)$`);
  if (!valid.test(objectKey)) return;
  try {
    await s3Request(config, "DELETE", objectKey);
  } catch (error) {
    console.error("Suppression d'image impossible", error);
  }
}
