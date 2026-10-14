/**
 * Scaleway Object Storage (Parijs, fr-par) — server-side helpers.
 *
 * Alle beelden staan in een Europese bucket; er wordt géén Amerikaanse
 * opslagdienst gebruikt. De browser uploadt rechtstreeks naar Scaleway met een
 * pre-signed URL, zodat er geen bestanden door onze server stromen.
 */
import {
  DeleteObjectCommand,
  GetBucketCorsCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Status van de opslagconfiguratie zonder ooit een sleutelwaarde te lekken. */
export type S3ConfigStatus = {
  configured: boolean;
  hasAccessKey: boolean;
  hasSecretKey: boolean;
  bucket: string;
  endpoint: string;
  region: string;
  publicPrefix: string;
};

export function s3ConfigStatus(): S3ConfigStatus {
  const region = process.env["S3_REGION"] || "fr-par";
  const bucket = process.env["S3_BUCKET_NAME"] || "maximilien-media";
  const hasAccessKey = Boolean(process.env["S3_ACCESS_KEY"]);
  const hasSecretKey = Boolean(process.env["S3_SECRET_KEY"]);
  return {
    configured: hasAccessKey && hasSecretKey,
    hasAccessKey,
    hasSecretKey,
    bucket,
    endpoint: process.env["S3_ENDPOINT"] || "https://s3.fr-par.scw.cloud",
    region,
    publicPrefix: (
      process.env["S3_PUBLIC_URL_PREFIX"] || `https://${bucket}.s3.${region}.scw.cloud`
    ).replace(/\/+$/, ""),
  };
}


export type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicPrefix: string;
};

export function s3Config(): S3Config {
  const endpoint = process.env["S3_ENDPOINT"] || "https://s3.fr-par.scw.cloud";
  const region = process.env["S3_REGION"] || "fr-par";
  const bucket = process.env["S3_BUCKET_NAME"] || "maximilien-media";
  const accessKey = process.env["S3_ACCESS_KEY"] || "";
  const secretKey = process.env["S3_SECRET_KEY"] || "";
  const publicPrefix = (
    process.env["S3_PUBLIC_URL_PREFIX"] || `https://${bucket}.s3.${region}.scw.cloud`
  ).replace(/\/+$/, "");
  if (!accessKey || !secretKey) {
    throw new Error("Objectopslag is niet geconfigureerd: S3_ACCESS_KEY of S3_SECRET_KEY ontbreekt.");
  }
  return { endpoint, region, bucket, accessKey, secretKey, publicPrefix };
}

function client(cfg: S3Config): S3Client {
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: false,
    credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
  });
}

/** Bestandsnaam → veilige, kleine slug met behoud van de extensie. */
export function slugifyFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "jpg";
  const slug =
    base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "bestand";
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  return `${slug}.${safeExt}`;
}

const FOLDER_RE = /^[a-z0-9][a-z0-9-/]{0,40}$/;

export function safeFolder(folder: string): string {
  const clean = folder.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  if (!FOLDER_RE.test(clean)) throw new Error("Ongeldige map voor objectopslag.");
  return clean;
}

export function publicUrlFor(cfg: S3Config, fileKey: string): string {
  return `${cfg.publicPrefix}/${fileKey}`;
}

/**
 * Normaliseert een afbeelding-URL naar de huidige publieke S3-prefix.
 * Werkt met relatieve keys, oude path-style URLs en huidige public URLs.
 * Onbekende externe absolute URLs worden onaangeroerd gelaten.
 */
export function normalizePublicImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const cfg = s3Config();
  const currentPrefix = cfg.publicPrefix;
  const s = url.trim();
  if (s.startsWith(`${currentPrefix}/`)) return s;
  if (s === currentPrefix) return currentPrefix;

  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      const virtualHost = `${cfg.bucket}.s3.${cfg.region}.scw.cloud`.toLowerCase();
      if (u.host.toLowerCase() === virtualHost) {
        const key = u.pathname.replace(/^\/+/, "");
        return key ? `${currentPrefix}/${key}` : currentPrefix;
      }
      const pathStylePrefix = `${cfg.endpoint.replace(/\/+$/, "")}/${cfg.bucket}/`.toLowerCase();
      if (s.toLowerCase().startsWith(pathStylePrefix)) {
        const key = s.slice(pathStylePrefix.length);
        return key ? `${currentPrefix}/${key}` : currentPrefix;
      }
      // Onbekende absolute URL: niet herschrijven.
      return s;
    }
  } catch {
    // parse error → behandel als relatief pad/key
  }

  const key = s.replace(/^\/+/, "");
  return key ? `${currentPrefix}/${key}` : null;
}

/** Zet een publieke URL terug om naar de object-key binnen de bucket. */
export function fileKeyFromUrl(cfg: S3Config, url: string): string | null {
  const candidates = [cfg.publicPrefix, `${cfg.endpoint.replace(/\/+$/, "")}/${cfg.bucket}`];
  for (const prefix of candidates) {
    if (url.startsWith(`${prefix}/`)) return decodeURIComponent(url.slice(prefix.length + 1));
  }
  return null;
}

export async function createUploadUrl(input: {
  fileName: string;
  fileType: string;
  folder: string;
}): Promise<{
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  headers: Record<string, string>;
}> {
  const cfg = s3Config();
  const fileKey = `${safeFolder(input.folder)}/${Date.now()}-${slugifyFileName(input.fileName)}`;
  // Leeg laten (S3_UPLOAD_ACL="") wanneer de bucket publiek is via bucket policy.
  const acl = process.env["S3_UPLOAD_ACL"] ?? "public-read";
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: fileKey,
    ContentType: input.fileType,
    ...(acl ? { ACL: acl as "public-read" } : {}),
  });
  const uploadUrl = await getSignedUrl(client(cfg), command, { expiresIn: 60 });
  // De browser MOET exact deze headers meesturen, anders klopt de handtekening niet.
  const headers: Record<string, string> = { "content-type": input.fileType };
  if (acl) headers["x-amz-acl"] = acl;
  return { uploadUrl, fileKey, publicUrl: publicUrlFor(cfg, fileKey), headers };
}

/** Best-effort opruimen van een publieke bucket-URL (bv. bij verwijderen van een record). */
export async function deleteByPublicUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    const cfg = s3Config();
    const key = fileKeyFromUrl(cfg, url);
    if (key) await deleteObject(key);
  } catch (error) {
    console.error("Opruimen van objectopslag mislukt:", error);
  }
}

/** Ruimt meerdere URL's op; fouten blokkeren nooit het verwijderen van het record. */
export async function deleteManyByPublicUrl(urls: Array<string | null | undefined>): Promise<void> {
  await Promise.all(urls.map((u) => deleteByPublicUrl(u)));
}

export async function deleteObject(fileKey: string): Promise<void> {
  const cfg = s3Config();
  await client(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: fileKey }));
}

/** Uploadt bytes rechtstreeks vanaf de server naar de bucket. */
export async function putObject(input: {
  fileKey: string;
  body: Uint8Array;
  contentType: string;
}): Promise<string> {
  const cfg = s3Config();
  const acl = process.env["S3_UPLOAD_ACL"] ?? "public-read";
  await client(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: input.fileKey,
      Body: input.body,
      ContentType: input.contentType,
      ...(acl ? { ACL: acl as "public-read" } : {}),
    }),
  );
  return publicUrlFor(cfg, input.fileKey);
}

/** Uploadt een base64-payload naar de bucket en geeft key + publieke URL terug. */
export async function putBase64Object(input: {
  folder: string;
  fileName: string;
  contentType: string;
  dataBase64: string;
}): Promise<{ fileKey: string; publicUrl: string }> {
  const binary = atob(input.dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const fileKey = `${safeFolder(input.folder)}/${Date.now()}-${slugifyFileName(input.fileName)}`;
  const publicUrl = await putObject({ fileKey, body: bytes, contentType: input.contentType });
  return { fileKey, publicUrl };
}

/** Toegestane origins voor directe browser-uploads naar de bucket. */
export function corsOrigins(): string[] {
  const extra = (process.env["S3_CORS_ORIGINS"] ?? "")
    .split(",")
    .map((v) => v.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return [
    ...new Set([
      "https://maximilien.brussels",
      "https://maximilien.site",
      "https://*.lovable.app",
      "http://localhost:8080",
      ...extra,
    ]),
  ];
}

/** Zet de CORS-regels op de bucket (idempotent). */
export async function applyBucketCors(): Promise<{ bucket: string; origins: string[] }> {
  const cfg = s3Config();
  const origins = corsOrigins();
  await client(cfg).send(
    new PutBucketCorsCommand({
      Bucket: cfg.bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
            AllowedOrigins: origins,
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  return { bucket: cfg.bucket, origins };
}

/** Metadata van één object (grootte en type) zonder het te downloaden. */
export async function headObject(
  fileKey: string,
): Promise<{ size: number; contentType: string | null; lastModified: string | null }> {
  const cfg = s3Config();
  const res = await client(cfg).send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: fileKey }));
  return {
    size: Number(res.ContentLength ?? 0),
    contentType: res.ContentType ?? null,
    lastModified: res.LastModified ? res.LastModified.toISOString() : null,
  };
}

/** Staan de CORS-regels al op de bucket? (`null` = kon niet gecontroleerd worden). */
export async function bucketCorsStatus(): Promise<{
  configured: boolean | null;
  origins: string[];
  error: string | null;
}> {
  try {
    const cfg = s3Config();
    const res = await client(cfg).send(new GetBucketCorsCommand({ Bucket: cfg.bucket }));
    const origins = (res.CORSRules ?? []).flatMap((r) => r.AllowedOrigins ?? []);
    return { configured: (res.CORSRules ?? []).length > 0, origins, error: null };
  } catch (error) {
    const name = (error as { name?: string; Code?: string } | null)?.name ?? "";
    const code = (error as { Code?: string } | null)?.Code ?? "";
    if (/NoSuchCORSConfiguration/i.test(name) || /NoSuchCORSConfiguration/i.test(code)) {
      return { configured: false, origins: [], error: null };
    }
    return {
      configured: null,
      origins: [],
      error: error instanceof Error ? error.message : "Onbekende fout",
    };
  }
}
