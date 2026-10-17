import "server-only";
import { createHash, createHmac } from "node:crypto";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type ImageType = (typeof TYPES)[number];

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
 * Stockage des images : bucket S3 privé, servi au public uniquement par CloudFront.
 * Pas de SDK : requêtes signées AWS Signature V4 (comme Stripe, on reste léger).
 *
 * Variables : S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 * CLOUDFRONT_URL (https://...), S3_PREFIX (optionnel, défaut `media`).
 */

/** Clés autorisées : `logo` ou `product-<slug>` (a-z, 0-9, tirets). */
export const MEDIA_KEY = /^(logo|product-[a-z0-9-]{1,80})$/;

const EXTENSIONS: Record<ImageType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type MediaConfig = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  baseUrl: string;
  prefix: string;
};

function readConfig(): MediaConfig | null {
  const bucket = process.env.S3_BUCKET?.trim();
  const region = process.env.S3_REGION?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const baseUrl = process.env.CLOUDFRONT_URL?.trim().replace(/\/+$/, "");
  const prefix = (process.env.S3_PREFIX?.trim() || "media").replace(/^\/+|\/+$/g, "");

  if (!bucket || !region || !accessKeyId || !secretAccessKey || !baseUrl) return null;
  // Nom de bucket sans point (sinon le certificat HTTPS ne correspond pas) ; préfixe sûr.
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) return null;
  if (!/^[a-z]{2}(-[a-z]+)+-\d$/.test(region)) return null;
  if (!/^[a-z0-9][a-z0-9/_-]{0,60}$/i.test(prefix)) return null;
  if (!baseUrl.startsWith("https://")) return null;
  return { bucket, region, accessKeyId, secretAccessKey, baseUrl, prefix };
}

/** Vrai si le stockage d'images est configuré (sinon l'envoi de photos est refusé proprement). */
export function isMediaConfigured() {
  return readConfig() !== null;
}

const sha256Hex = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const hmac = (key: string | Buffer, data: string) => createHmac("sha256", key).update(data).digest();

/** Requête S3 signée (SigV4). `key` ne contient que [a-z0-9/_.-], jamais d'entrée brute. */
async function s3Request(
  config: MediaConfig,
  method: "PUT" | "DELETE",
  key: string,
  body?: Buffer,
  extraHeaders: Record<string, string> = {},
) {
  const host = `${config.bucket}.s3.${config.region}.amazonaws.com`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20260101T000000Z
  const day = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body ?? "");

  const headers: Record<string, string> = {
    ...extraHeaders,
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map((name) => `${name}:${headers[name].trim()}\n`).join("");
  const signedHeaders = names.join(";");
  const canonicalRequest = [method, `/${key}`, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const scope = `${day}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, day), config.region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const sendHeaders = { ...headers };
  delete sendHeaders.host; // ajouté par fetch, déjà signé ci-dessus
  const response = await fetch(`https://${host}/${key}`, {
    method,
    headers: {
      ...sendHeaders,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: body ? new Uint8Array(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    // On ne journalise que le statut : le corps d'erreur S3 peut citer le bucket et la clé d'accès.
    throw new Error(`S3 ${method} a échoué (${response.status}).`);
  }
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
  const valid = new RegExp(`^${config.prefix}/(logo|product-[a-z0-9-]{1,80})/\\d+\\.(png|jpg|webp)$`);
  if (!valid.test(objectKey)) return;
  try {
    await s3Request(config, "DELETE", objectKey);
  } catch (error) {
    console.error("Suppression d'image impossible", error);
  }
}
