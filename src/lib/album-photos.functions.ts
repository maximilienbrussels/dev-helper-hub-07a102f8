/**
 * Fotoalbums die het team zelf beheert (server functions).
 *
 * De beelden staan in de Europese Scaleway-bucket; hier bewaren we per album
 * de volgorde en het drietalige bijschrift. Publiek lezen mag zonder login,
 * beheren vereist het recht `manage_media`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

export type AlbumPhoto = {
  id: string;
  albumKey: string;
  url: string;
  alt: { nl: string; fr: string; en: string };
  position: number;
};

/** Alle beheerde foto's, gegroepeerd per album. */
export type AlbumPhotoMap = Record<string, AlbumPhoto[]>;

const ALBUM_KEY_RE = /^[a-z0-9][a-z0-9:_-]{0,60}$/;

const albumKey = z.string().regex(ALBUM_KEY_RE, "Ongeldige albumsleutel.");

type Row = {
  id: string;
  album_key: string;
  url: string;
  alt_nl: string | null;
  alt_fr: string | null;
  alt_en: string | null;
  position: number;
};

function toPhoto(row: Row): AlbumPhoto {
  return {
    id: String(row.id),
    albumKey: row.album_key,
    url: row.url,
    alt: { nl: row.alt_nl ?? "", fr: row.alt_fr ?? "", en: row.alt_en ?? "" },
    position: Number(row.position ?? 0),
  };
}

async function readAll(): Promise<AlbumPhotoMap> {
  const { db, hasDatabase } = await import("@/lib/neon.server");
  if (!hasDatabase()) return {};
  try {
    const rows = (await db()`
      select id, album_key, url, alt_nl, alt_fr, alt_en, position
      from album_photos
      order by album_key, position, created_at
    `) as unknown as Row[];
    const map: AlbumPhotoMap = {};
    for (const row of rows) {
      const photo = toPhoto(row);
      (map[photo.albumKey] ??= []).push(photo);
    }
    return map;
  } catch (error) {
    console.error("album_photos lezen mislukt:", error);
    return {};
  }
}

/** Publieke lijst (alle albums) — faalt nooit hard, zodat de site altijd rendert. */
export const listAlbumPhotos = createServerFn({ method: "GET" }).handler(
  async (): Promise<AlbumPhotoMap> => readAll(),
);

const addSchema = z.object({
  albumKey,
  photos: z
    .array(
      z.object({
        url: z.string().min(1).max(1000),
        storageKey: z
          .string()
          .max(500)
          .regex(/^(animals|media)\/[A-Za-z0-9._\/-]+$/)
          .refine((k) => !k.includes(".."))
          .nullable()
          .default(null),
        altNl: z.string().max(300).default(""),
        altFr: z.string().max(300).default(""),
        altEn: z.string().max(300).default(""),
      }),
    )
    .min(1)
    .max(30),
});

/** Foto's aan een album toevoegen (achteraan). */
export const addAlbumPhotos = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => addSchema.parse(d))
  .handler(async ({ data, context }): Promise<AlbumPhotoMap> => {
    await requirePermission(context, "manage_media");
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select coalesce(max(position) + 1, 0) as next from album_photos where album_key = ${data.albumKey}
    `) as unknown as Array<{ next: number }>;
    let position = Number(rows[0]?.next ?? 0);
    for (const photo of data.photos) {
      await db()`
        insert into album_photos (album_key, url, storage_key, alt_nl, alt_fr, alt_en, position, created_by)
        values (${data.albumKey}, ${photo.url}, ${photo.storageKey}, ${photo.altNl},
                ${photo.altFr}, ${photo.altEn}, ${position}, ${email})
      `;
      position += 1;
    }
    return readAll();
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  altNl: z.string().max(300).default(""),
  altFr: z.string().max(300).default(""),
  altEn: z.string().max(300).default(""),
});

/** Bijschrift van één foto aanpassen. */
export const updateAlbumPhoto = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }): Promise<AlbumPhotoMap> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    await db()`
      update album_photos
         set alt_nl = ${data.altNl}, alt_fr = ${data.altFr}, alt_en = ${data.altEn}, updated_at = now()
       where id = ${data.id}
    `;
    return readAll();
  });

/** Foto verwijderen — ook het bestand in de bucket. */
export const deleteAlbumPhoto = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<AlbumPhotoMap> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select url, storage_key from album_photos where id = ${data.id}
    `) as unknown as Array<{ url: string; storage_key: string | null }>;
    await db()`delete from album_photos where id = ${data.id}`;
    const row = rows[0];
    // Bestand alleen wissen als niets anders (ander album of mediabibliotheek) het nog gebruikt.
    let inUse = false;
    if (row) {
      const refs = (await db()`
        select 1 from album_photos where ${row.storage_key}::text is not null and storage_key = ${row.storage_key}
        union all select 1 from album_photos where url = ${row.url}
        union all select 1 from media_assets where (${row.storage_key}::text is not null and storage_key = ${row.storage_key})
        limit 1
      `.catch(() => [1])) as unknown[];
      inUse = refs.length > 0;
    }
    if (row && !inUse) {
      const { deleteObject, deleteByPublicUrl } = await import("@/lib/s3.server");
      try {
        if (row.storage_key) await deleteObject(row.storage_key);
        else await deleteByPublicUrl(row.url);
      } catch (error) {
        console.error("Bestand uit de bucket wissen mislukt:", error);
      }
    }
    return readAll();
  });

/** Nieuwe volgorde binnen één album bewaren. */
export const reorderAlbumPhotos = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ albumKey, ids: z.array(z.string().uuid()).max(200) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<AlbumPhotoMap> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    for (const [index, id] of data.ids.entries()) {
      await db()`
        update album_photos set position = ${index}, updated_at = now()
         where id = ${id} and album_key = ${data.albumKey}
      `;
    }
    return readAll();
  });
