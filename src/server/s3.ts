import "server-only";
import { createHash, createHmac } from "node:crypto";

/**
 * Accès S3 sans SDK : requêtes signées AWS Signature V4. Le même bucket sert les images publiques
 * (préfixe `media/`, lues via CloudFront) et les documents privés (préfixe `documents/`, jamais
 * exposés par CloudFront, lus uniquement par ce serveur).
 *
 * Variables : S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.
 */
export type S3Config = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

/** Dossier des documents privés (factures, avoirs). Ne doit jamais être servi par CloudFront. */
export const DOCUMENTS_PREFIX = "documents";

export function readS3Config(): S3Config | null {
  const bucket = process.env.S3_BUCKET?.trim();
  const region = process.env.S3_REGION?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();

  if (!bucket || !region || !accessKeyId || !secretAccessKey) return null;
  // Nom de bucket sans point (sinon le certificat HTTPS ne correspond pas).
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) return null;
  if (!/^[a-z]{2}(-[a-z]+)+-\d$/.test(region)) return null;
  return { bucket, region, accessKeyId, secretAccessKey };
}

export class S3Error extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "S3Error";
  }
}

const sha256Hex = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const hmac = (key: string | Buffer, data: string) => createHmac("sha256", key).update(data).digest();

/** Requête S3 signée (SigV4). `key` ne contient que [A-Za-z0-9/_.-], jamais d'entrée brute. */
export async function s3Request(
  config: S3Config,
  method: "GET" | "PUT" | "DELETE",
  key: string,
  body?: Buffer,
  extraHeaders: Record<string, string> = {},
  timeoutMs = 15_000,
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
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    // On ne journalise que le statut : le corps d'erreur S3 peut citer le bucket et la clé d'accès.
    throw new S3Error(`S3 ${method} a échoué (${response.status}).`, response.status);
  }
  return response;
}
