/**
 * Centrale mediabibliotheek — server functions.
 *
 * Bestanden worden als base64 in `media_assets` bewaard en uitgeserveerd via
 * /api/public/media/<id>. Zo blijft de URL (en dus elke referentie op de site)
 * stabiel wanneer een beeld vervangen wordt: het ID verandert niet.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

export const MEDIA_CATEGORIES = [
  "general",
  "hero",
  "animals",
  "workshops",
  "news",
  "events",
  "team",
] as const;
export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  general: "Algemeen",
  hero: "Hero-beelden",
  animals: "Dieren",
  workshops: "Workshops",
  news: "Nieuws",
  events: "Evenementen",
  team: "Team",
};

export type MediaAsset = {
  id: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  category: MediaCategory;
  title: string;
  description: string;
  altText: string;
  url: string;
  storageKey: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 8 MB per bestand — ruim voldoende voor webbeelden. */
export const MEDIA_MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];

type Row = {
  id: string;
  storage_url?: string | null;
  storage_key?: string | null;
  filename: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  category: string;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toAsset(row: Row): MediaAsset {
  return {
    id: String(row.id),
    filename: row.filename,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size ?? 0),
    width: row.width ?? null,
    height: row.height ?? null,
    category: (MEDIA_CATEGORIES as readonly string[]).includes(row.category)
      ? (row.category as MediaCategory)
      : "general",
    title: row.title ?? "",
    description: row.description ?? "",
    altText: row.alt_text ?? "",
    url: row.storage_url ? row.storage_url : `/api/public/media/${row.id}`,
    storageKey: row.storage_key ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(3).max(100),
  dataBase64: z.string().min(1),
  category: z.enum(MEDIA_CATEGORIES).default("general"),
  title: z.string().max(200).default(""),
  description: z.string().max(2000).default(""),
  altText: z.string().max(500).default(""),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
});

function validateBinary(mimeType: string, dataBase64: string): number {
  if (!ALLOWED_MIME.includes(mimeType)) {
    throw new Error("Dit bestandstype wordt niet ondersteund (enkel afbeeldingen).");
  }
  const bytes = Math.floor((dataBase64.length * 3) / 4);
  if (bytes > MEDIA_MAX_BYTES) {
    throw new Error("Dit bestand is groter dan 8 MB. Verklein het beeld en probeer opnieuw.");
  }
  return bytes;
}

/** Volledige bibliotheek (zonder binaire data). */
export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<MediaAsset[]> => {
    await requirePermission(context, "view_media");
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select id, filename, mime_type, byte_size, width, height, category,
             title, description, alt_text, storage_url, storage_key, created_at, updated_at
      from media_assets
      where deleted_at is null
      order by created_at desc
    `) as unknown as Row[];
    return rows.map(toAsset);
  });

/** Nieuw bestand opladen. */
export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data, context }): Promise<MediaAsset> => {
    await requirePermission(context, "manage_media");
    const size = validateBinary(data.mimeType, data.dataBase64);
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    const { putBase64Object } = await import("@/lib/s3.server");
    const { fileKey, publicUrl } = await putBase64Object({
      folder: `media/${data.category}`,
      fileName: data.filename,
      contentType: data.mimeType,
      dataBase64: data.dataBase64,
    });
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      insert into media_assets
        (filename, mime_type, byte_size, width, height, category, title, description, alt_text, storage_url, storage_key, created_by)
      values
        (${data.filename}, ${data.mimeType}, ${size}, ${data.width}, ${data.height},
         ${data.category}, ${data.title}, ${data.description}, ${data.altText}, ${publicUrl}, ${fileKey}, ${email})
      returning id, filename, mime_type, byte_size, width, height, category,
                title, description, alt_text, storage_url, storage_key, created_at, updated_at
    `) as unknown as Row[];
    const row = rows[0];
    if (!row) throw new Error("Opladen mislukt — geen databaseverbinding.");
    return toAsset(row);
  });

/** Bestaand beeld vervangen: het ID (en dus elke URL op de site) blijft gelijk. */
export const replaceMedia = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        filename: z.string().min(1).max(200),
        mimeType: z.string().min(3).max(100),
        dataBase64: z.string().min(1),
        width: z.number().int().positive().nullable().default(null),
        height: z.number().int().positive().nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<MediaAsset> => {
    await requirePermission(context, "manage_media");
    const size = validateBinary(data.mimeType, data.dataBase64);
    const { db } = await import("@/lib/neon.server");
    const { putBase64Object, deleteObject } = await import("@/lib/s3.server");
    const previous = (await db()`
      select storage_key from media_assets where id = ${data.id}
    `) as unknown as Array<{ storage_key: string | null }>;
    const { fileKey, publicUrl } = await putBase64Object({
      folder: "media/general",
      fileName: data.filename,
      contentType: data.mimeType,
      dataBase64: data.dataBase64,
    });
    const oldKey = previous[0]?.storage_key ?? null;
    if (oldKey) await deleteObject(oldKey).catch(() => undefined);
    const rows = (await db()`
      update media_assets set
        filename = ${data.filename},
        mime_type = ${data.mimeType},
        byte_size = ${size},
        width = ${data.width},
        height = ${data.height},
        storage_url = ${publicUrl},
        storage_key = ${fileKey},
        data_base64 = null,
        updated_at = now()
      where id = ${data.id}
      returning id, filename, mime_type, byte_size, width, height, category,
                title, description, alt_text, storage_url, storage_key, created_at, updated_at
    `) as unknown as Row[];
    const row = rows[0];
    if (!row) throw new Error("Dit mediabestand bestaat niet meer.");
    return toAsset(row);
  });

/** Metadata (alt-tekst, titel, beschrijving, categorie) bijwerken. */
export const updateMediaMeta = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().max(200).default(""),
        description: z.string().max(2000).default(""),
        altText: z.string().max(500).default(""),
        category: z.enum(MEDIA_CATEGORIES).default("general"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<MediaAsset> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      update media_assets set
        title = ${data.title},
        description = ${data.description},
        alt_text = ${data.altText},
        category = ${data.category},
        updated_at = now()
      where id = ${data.id}
      returning id, filename, mime_type, byte_size, width, height, category,
                title, description, alt_text, storage_url, storage_key, created_at, updated_at
    `) as unknown as Row[];
    const row = rows[0];
    if (!row) throw new Error("Dit mediabestand bestaat niet meer.");
    return toAsset(row);
  });

/** Definitief verwijderen. */
export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    // Zacht verwijderen: 30 dagen herstelbaar via Logboek & prullenbak.
    await db()`update media_assets set deleted_at = now() where id = ${data.id}`;
    return { ok: true };
  });

/** Prullenbak: zacht verwijderde beelden (herstelbaar of definitief te wissen). */
export const listTrashedMedia = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<MediaAsset[]> => {
    await requirePermission(context, "view_media");
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select id, filename, mime_type, byte_size, width, height, category,
             title, description, alt_text, storage_url, storage_key, created_at, updated_at
      from media_assets
      where deleted_at is not null
      order by deleted_at desc
    `) as unknown as Row[];
    return rows.map(toAsset);
  });

/** Herstelt een zacht verwijderd beeld vanuit de prullenbak. */
export const restoreMedia = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    await db()`update media_assets set deleted_at = null where id = ${data.id}`;
    return { ok: true };
  });

/** Definitief verwijderen: rij én opgeslagen bestand zijn onherroepelijk weg. */
export const hardDeleteMedia = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    const { deleteObject } = await import("@/lib/s3.server");
    const rows = (await db()`
      select storage_key from media_assets where id = ${data.id}
    `) as unknown as Array<{ storage_key: string | null }>;
    const key = rows[0]?.storage_key ?? null;
    if (key) await deleteObject(key).catch(() => undefined);
    await db()`delete from media_assets where id = ${data.id}`;
    return { ok: true };
  });

/* ------------------------------------------------------------- opslag → bibliotheek */

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

function mimeFromKey(key: string): string {
  const ext = (key.split(".").pop() ?? "").toLowerCase();
  return MIME_BY_EXT[ext] ?? "image/jpeg";
}

function categoryFromKey(key: string): MediaCategory {
  const parts = key.toLowerCase().split("/");
  for (const part of parts) {
    if ((MEDIA_CATEGORIES as readonly string[]).includes(part)) return part as MediaCategory;
  }
  return "general";
}

/**
 * Registreert één bestand uit de Scaleway-bucket in de bibliotheek.
 * Bestaat de sleutel al (ook in de prullenbak), dan wordt die rij hersteld en
 * teruggegeven — er ontstaan nooit dubbele registraties.
 */
async function registerKey(key: string, email: string | null): Promise<MediaAsset> {
  const { db } = await import("@/lib/neon.server");
  const { s3Config, publicUrlFor, headObject } = await import("@/lib/s3.server");
  const cleanKey = key.replace(/^\/+/, "");

  const existing = (await db()`
    update media_assets set deleted_at = null, updated_at = now()
    where storage_key = ${cleanKey}
    returning id, filename, mime_type, byte_size, width, height, category,
              title, description, alt_text, storage_url, storage_key, created_at, updated_at
  `) as unknown as Row[];
  if (existing[0]) return toAsset(existing[0]);

  const cfg = s3Config();
  const meta = await headObject(cleanKey);
  const filename = cleanKey.split("/").pop() ?? cleanKey;
  const mime = meta.contentType && meta.contentType.startsWith("image/") ? meta.contentType : mimeFromKey(cleanKey);
  const title = filename.replace(/\.[^.]+$/, "").replace(/^\d{10,}-/, "").replace(/[-_]+/g, " ").trim();

  const rows = (await db()`
    insert into media_assets
      (filename, mime_type, byte_size, width, height, category, title, description, alt_text, storage_url, storage_key, created_by)
    values
      (${filename}, ${mime}, ${meta.size}, null, null, ${categoryFromKey(cleanKey)}, ${title}, '', '',
       ${publicUrlFor(cfg, cleanKey)}, ${cleanKey}, ${email})
    returning id, filename, mime_type, byte_size, width, height, category,
              title, description, alt_text, storage_url, storage_key, created_at, updated_at
  `) as unknown as Row[];
  const row = rows[0];
  if (!row) throw new Error("Registreren mislukt — geen databaseverbinding.");
  return toAsset(row);
}

/** Eén bestand uit de opslag in de bibliotheek opnemen (en meteen bruikbaar maken). */
export const registerStorageObject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ key: z.string().min(1).max(400) }).parse(d))
  .handler(async ({ data, context }): Promise<MediaAsset> => {
    await requirePermission(context, "manage_media");
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    return registerKey(data.key, email);
  });

/** Meerdere bestanden (bv. een hele map) in één keer registreren. */
export const registerStorageObjects = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ keys: z.array(z.string().min(1).max(400)).min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ assets: MediaAsset[]; failed: string[] }> => {
    await requirePermission(context, "manage_media");
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    const assets: MediaAsset[] = [];
    const failed: string[] = [];
    for (const key of data.keys) {
      try {
        assets.push(await registerKey(key, email));
      } catch (error) {
        console.error("[media] registreren mislukt:", key, error);
        failed.push(key);
      }
    }
    return { assets, failed };
  });

/** Welke opslagsleutels zitten al in de bibliotheek? (voor de Opslag-tab) */
export const listRegisteredStorageKeys = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<Record<string, string>> => {
    await requirePermission(context, "view_media");
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select id, storage_key from media_assets where storage_key is not null and deleted_at is null
    `) as unknown as Array<{ id: string; storage_key: string }>;
    return Object.fromEntries(rows.map((r) => [r.storage_key, String(r.id)]));
  });
