import "server-only";
import { randomBytes } from "node:crypto";
import { DOCUMENTS_PREFIX, S3Error, readS3Config, s3Request } from "./s3";

/**
 * Archive des PDF émis (factures, avoirs) dans le bucket S3, sous `documents/`. Ce dossier n'est
 * pas lisible par CloudFront (la bucket policy ne couvre que `media/*`) : seul ce serveur le lit,
 * après avoir vérifié les droits. La clé contient un suffixe aléatoire par défense en profondeur.
 */
const NUMBER = /^(FA|AV)-(\d{4})-\d{6}$/;
const TIMEOUT_MS = 5_000;
const KEY = new RegExp(
  `^${DOCUMENTS_PREFIX}/(invoices|credit-notes)/\\d{4}/(FA|AV)-\\d{4}-\\d{6}-[a-f0-9]{16}\\.pdf$`,
);

export const isDocumentStorageConfigured = () => readS3Config() !== null;

export function documentKey(number: string) {
  const match = NUMBER.exec(number);
  if (!match) throw new Error("Numéro de document invalide.");
  const folder = match[1] === "FA" ? "invoices" : "credit-notes";
  return `${DOCUMENTS_PREFIX}/${folder}/${match[2]}/${number}-${randomBytes(8).toString("hex")}.pdf`;
}

export async function storeDocument(key: string, pdf: Uint8Array) {
  const config = readS3Config();
  if (!config) throw new Error("Stockage S3 non configuré.");
  if (!KEY.test(key)) throw new Error("Clé de document invalide.");
  // Timeout court : l'archivage ne doit pas retarder la confirmation de commande (webhook Stripe).
  await s3Request(
    config,
    "PUT",
    key,
    Buffer.from(pdf),
    {
      "cache-control": "private, no-store",
      "content-type": "application/pdf",
      "x-amz-server-side-encryption": "AES256",
    },
    TIMEOUT_MS,
  );
}

/** Lit un PDF archivé ; null s'il est absent. Les autres erreurs sont propagées. */
export async function loadDocument(key: string) {
  const config = readS3Config();
  if (!config || !KEY.test(key)) return null;
  try {
    const response = await s3Request(config, "GET", key, undefined, {}, TIMEOUT_MS);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    // Sans droit ListBucket, S3 répond 403 (et non 404) pour un objet absent.
    if (error instanceof S3Error && (error.status === 404 || error.status === 403)) {
      if (error.status === 403) console.warn("[documents] lecture S3 refusée (403) : vérifier le droit GetObject sur documents/*.");
      return null;
    }
    throw error;
  }
}
