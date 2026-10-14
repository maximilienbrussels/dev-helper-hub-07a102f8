/**
 * Mediabibliotheek op Scaleway Object Storage (server-only).
 *
 * Lijsten, uploaden, verwijderen en het opsporen van gelijkaardige of dubbele
 * foto's op basis van bestandsnaam, mapstructuur en beeldverhouding.
 */
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { s3Config, publicUrlFor, safeFolder, slugifyFileName, type S3Config } from "./s3.server";

function client(cfg: S3Config): S3Client {
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: false,
    credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
  });
}

export type MediaObject = {
  key: string;
  name: string;
  url: string;
  size: number;
  lastModified: string | null;
  hash: string;
  folder: string;
};

export type MediaListing = {
  prefix: string;
  folders: string[];
  objects: MediaObject[];
  nextToken: string | null;
};

/** Korte, stabiele hash van een tekst (voor dubbeldetectie op naam). */
export function stringHash(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Naam zonder extensie, zonder tijdstempel en zonder variantsuffix. */
export function nameSignature(key: string): string {
  const file = key.split("/").pop() ?? key;
  return file
    .replace(/\.[^.]+$/, "")
    .replace(/^\d{10,}-/, "")
    .replace(/[-_](alt|copy|kopie|final|v?\d{1,3}|\d{2,4}x\d{2,4})$/gi, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function toObject(cfg: S3Config, key: string, size: number, lastModified: Date | undefined): MediaObject {
  const parts = key.split("/");
  const name = parts.pop() ?? key;
  return {
    key,
    name,
    url: publicUrlFor(cfg, key),
    size,
    lastModified: lastModified ? lastModified.toISOString() : null,
    hash: stringHash(nameSignature(key) + ":" + size),
    folder: parts.join("/"),
  };
}

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

/** Eén pagina objecten binnen een map (delimiter `/`). */
export async function listMedia(input: {
  prefix?: string;
  token?: string | null;
  limit?: number;
}): Promise<MediaListing> {
  const cfg = s3Config();
  const prefix = input.prefix ? `${safeFolder(input.prefix)}/` : "";
  const res = await client(cfg).send(
    new ListObjectsV2Command({
      Bucket: cfg.bucket,
      Prefix: prefix,
      Delimiter: "/",
      MaxKeys: Math.min(Math.max(input.limit ?? 100, 1), 1000),
      ...(input.token ? { ContinuationToken: input.token } : {}),
    }),
  );

  const folders = (res.CommonPrefixes ?? [])
    .map((p) => (p.Prefix ?? "").replace(/\/$/, ""))
    .filter(Boolean);

  const objects = (res.Contents ?? [])
    .filter((o) => o.Key && !o.Key.endsWith("/") && IMAGE_RE.test(o.Key))
    .map((o) => toObject(cfg, o.Key as string, o.Size ?? 0, o.LastModified));

  return {
    prefix: prefix.replace(/\/$/, ""),
    folders,
    objects,
    nextToken: res.IsTruncated ? (res.NextContinuationToken ?? null) : null,
  };
}

/** Alle objecten (tot een maximum) om te vergelijken. */
async function listAll(cfg: S3Config, prefix: string, max = 2000): Promise<MediaObject[]> {
  const out: MediaObject[] = [];
  let token: string | undefined;
  do {
    const res = await client(cfg).send(
      new ListObjectsV2Command({
        Bucket: cfg.bucket,
        Prefix: prefix,
        MaxKeys: 1000,
        ...(token ? { ContinuationToken: token } : {}),
      }),
    );
    for (const o of res.Contents ?? []) {
      if (!o.Key || o.Key.endsWith("/") || !IMAGE_RE.test(o.Key)) continue;
      out.push(toObject(cfg, o.Key, o.Size ?? 0, o.LastModified));
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token && out.length < max);
  return out;
}

export type SimilarMatch = MediaObject & { score: number; reason: string };

function tokens(signature: string): Set<string> {
  return new Set(signature.split("-").filter((t) => t.length > 2));
}

/**
 * Zoekt gelijkaardige of dubbele beelden: identieke naamhandtekening,
 * gedeelde woorden in de naam, dezelfde map of dezelfde beeldverhouding.
 */
export async function findSimilarMedia(input: {
  key?: string;
  filename?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  prefix?: string;
  limit?: number;
}): Promise<{ matches: SimilarMatch[]; exactDuplicate: SimilarMatch | null }> {
  const cfg = s3Config();
  const reference = input.key ?? input.filename ?? "";
  if (!reference) return { matches: [], exactDuplicate: null };

  const refSignature = nameSignature(reference);
  const refTokens = tokens(refSignature);
  const refFolder = input.key ? input.key.split("/").slice(0, -1).join("/") : (input.prefix ?? "");
  const refRatio =
    input.width && input.height ? Number((input.width / input.height).toFixed(2)) : null;

  const all = await listAll(cfg, input.prefix ? `${safeFolder(input.prefix)}/` : "");
  const matches: SimilarMatch[] = [];

  for (const object of all) {
    if (input.key && object.key === input.key) continue;
    const signature = nameSignature(object.key);
    let score = 0;
    const reasons: string[] = [];

    if (signature === refSignature) {
      score += 0.7;
      reasons.push("dezelfde bestandsnaam");
    } else {
      const objTokens = tokens(signature);
      const shared = [...refTokens].filter((t) => objTokens.has(t)).length;
      const union = new Set([...refTokens, ...objTokens]).size || 1;
      const overlap = shared / union;
      if (overlap > 0.34) {
        score += overlap * 0.6;
        reasons.push("gelijkaardige naam");
      }
    }

    if (refFolder && object.folder === refFolder) {
      score += 0.15;
      reasons.push("zelfde map");
    }
    if (input.size && Math.abs(object.size - input.size) / Math.max(object.size, 1) < 0.02) {
      score += 0.25;
      reasons.push("bijna dezelfde bestandsgrootte");
    }
    if (refRatio) {
      const objRatioSource = object.name.match(/(\d{2,4})x(\d{2,4})/);
      if (objRatioSource) {
        const ratio = Number(objRatioSource[1]) / Number(objRatioSource[2]);
        if (Math.abs(ratio - refRatio) < 0.03) {
          score += 0.2;
          reasons.push("zelfde beeldverhouding");
        }
      }
    }

    if (score >= 0.3) matches.push({ ...object, score: Number(score.toFixed(2)), reason: reasons.join(", ") });
  }

  matches.sort((a, b) => b.score - a.score);
  const limited = matches.slice(0, input.limit ?? 40);
  const exactDuplicate = limited.find((m) => m.score >= 0.9) ?? null;
  return { matches: limited, exactDuplicate };
}

/** Uploadt bytes rechtstreeks naar de bucket met een opgeschoonde naam. */
export async function uploadMediaObject(input: {
  folder: string;
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<MediaObject> {
  const cfg = s3Config();
  const key = `${safeFolder(input.folder)}/${Date.now()}-${slugifyFileName(input.fileName)}`;
  await client(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: input.bytes,
      ContentType: input.contentType,
      ACL: (process.env["S3_UPLOAD_ACL"] ?? "public-read") as "public-read",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return toObject(cfg, key, input.bytes.byteLength, new Date());
}

/** Verwijdert objecten definitief uit de bucket. */
export async function deleteMediaObjects(keys: string[]): Promise<number> {
  const cfg = s3Config();
  const clean = keys.map((k) => k.replace(/^\/+/, "")).filter(Boolean);
  if (clean.length === 0) return 0;
  await client(cfg).send(
    new DeleteObjectsCommand({
      Bucket: cfg.bucket,
      Delete: { Objects: clean.map((Key) => ({ Key })), Quiet: true },
    }),
  );
  return clean.length;
}
