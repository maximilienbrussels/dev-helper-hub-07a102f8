/**
 * Zet een media-bibliotheek-ID om naar de definitieve Scaleway S3-URL.
 * Zo staat er altijd een harde bucket-URL in Neon, geen doorverwijzing.
 */
export async function storageUrlForMedia(mediaId: string | null | undefined): Promise<string | null> {
  if (!mediaId) return null;
  const { db } = await import("@/lib/neon.server");
  const rows = (await db()`
    select storage_url from media_assets where id = ${mediaId}
  `) as unknown as Array<{ storage_url: string | null }>;
  return rows[0]?.storage_url ?? `/api/public/media/${mediaId}`;
}
