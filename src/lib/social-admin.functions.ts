/**
 * Social-beheer — server functions.
 *
 * Twee datasets:
 *  - `social_hidden_posts`: platform-agnostische "verberg"-vlag voor extern
 *    opgehaalde berichten (Bluesky, Mastodon, …), geïdentificeerd door
 *    (platform, post_id).
 *  - `social_posts`: eigen berichten (platform "eigen"), drietalig en met
 *    een optioneel beeld uit de mediabibliotheek.
 *
 * De publieke functies (geen auth) leveren enkel wat de publieke site nodig
 * heeft: de lijst verborgen ID's en de actieve eigen berichten.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

export type SocialPlatform = "bluesky" | "mastodon" | "eigen" | (string & {});

export type HiddenPost = {
  id: string;
  platform: string;
  postId: string;
  hiddenBy: string | null;
  reden: string;
  createdAt: string;
};

export type SocialPost = {
  id: string;
  platform: "eigen";
  tekstNl: string;
  tekstFr: string;
  tekstEn: string;
  mediaUrl: string | null;
  mediaId: string | null;
  link: string;
  gepubliceerdOp: string;
  actief: boolean;
  createdAt: string;
  updatedAt: string;
};

type HiddenRow = {
  id: string;
  platform: string;
  post_id: string;
  hidden_by: string | null;
  reden: string | null;
  created_at: string | Date;
};

type PostRow = {
  id: string;
  platform: string;
  tekst_nl: string | null;
  tekst_fr: string | null;
  tekst_en: string | null;
  media_url: string | null;
  media_id: string | null;
  link: string | null;
  gepubliceerd_op: string | Date;
  actief: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

function toHidden(row: HiddenRow): HiddenPost {
  return {
    id: String(row.id),
    platform: row.platform,
    postId: row.post_id,
    hiddenBy: row.hidden_by,
    reden: row.reden ?? "",
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function toPost(row: PostRow): SocialPost {
  return {
    id: String(row.id),
    platform: "eigen",
    tekstNl: row.tekst_nl ?? "",
    tekstFr: row.tekst_fr ?? "",
    tekstEn: row.tekst_en ?? "",
    mediaUrl: row.media_url,
    mediaId: row.media_id,
    link: row.link ?? "",
    gepubliceerdOp: new Date(row.gepubliceerd_op).toISOString(),
    actief: row.actief,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/* ---------------------------- publieke kant ---------------------------- */

/** Verborgen (platform, post_id)-combinaties — voor de publieke feed. */
export const fetchHiddenSocialIds = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ platform: string; postId: string }[]> => {
    const { ensureSocialTablesQuiet } = await import("@/lib/social-admin.server");
    await ensureSocialTablesQuiet();
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select platform, post_id from social_hidden_posts
    `) as unknown as { platform: string; post_id: string }[];
    return rows.map((r) => ({ platform: r.platform, postId: r.post_id }));
  },
);

/** Actieve eigen berichten — voor de publieke feed, nieuwste eerst. */
export const fetchPublicSocialPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<SocialPost[]> => {
    const { ensureSocialTablesQuiet } = await import("@/lib/social-admin.server");
    await ensureSocialTablesQuiet();
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select id, platform, tekst_nl, tekst_fr, tekst_en, media_url, media_id, link,
             gepubliceerd_op, actief, created_at, updated_at
      from social_posts
      where actief
      order by gepubliceerd_op desc
    `) as unknown as PostRow[];
    return rows.map(toPost);
  },
);

/* ----------------------------- beheerkant ------------------------------ */

/** Alle verborgen berichten, voor de beheer-UI. */
export const listHiddenSocialPosts = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<HiddenPost[]> => {
    await requirePermission(context, "view_media");
    const { ensureSocialTables } = await import("@/lib/social-admin.server");
    await ensureSocialTables();
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select id, platform, post_id, hidden_by, reden, created_at
      from social_hidden_posts
      order by created_at desc
    `) as unknown as HiddenRow[];
    return rows.map(toHidden);
  });

const hideSchema = z.object({
  platform: z.string().min(1).max(40),
  postId: z.string().min(1).max(500),
  reden: z.string().max(500).default(""),
});

/** Bericht verbergen op de publieke site (idempotent: upsert). */
export const hideSocialPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => hideSchema.parse(d))
  .handler(async ({ data, context }): Promise<HiddenPost> => {
    await requirePermission(context, "manage_media");
    const { ensureSocialTables } = await import("@/lib/social-admin.server");
    await ensureSocialTables();
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      insert into social_hidden_posts (platform, post_id, hidden_by, reden)
      values (${data.platform}, ${data.postId}, ${email}, ${data.reden})
      on conflict (platform, post_id) do update set reden = excluded.reden
      returning id, platform, post_id, hidden_by, reden, created_at
    `) as unknown as HiddenRow[];
    const row = rows[0];
    if (!row) throw new Error("Verbergen mislukt — geen databaseverbinding.");
    return toHidden(row);
  });

const unhideSchema = z.object({ platform: z.string().min(1).max(40), postId: z.string().min(1).max(500) });

/** Bericht opnieuw tonen op de publieke site. */
export const unhideSocialPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => unhideSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_media");
    const { ensureSocialTables } = await import("@/lib/social-admin.server");
    await ensureSocialTables();
    const { db } = await import("@/lib/neon.server");
    await db()`
      delete from social_hidden_posts
      where platform = ${data.platform} and post_id = ${data.postId}
    `;
    return { ok: true };
  });

/** Alle eigen berichten (incl. inactieve), voor de beheer-UI. */
export const listSocialPosts = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<SocialPost[]> => {
    await requirePermission(context, "view_media");
    const { ensureSocialTables } = await import("@/lib/social-admin.server");
    await ensureSocialTables();
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      select id, platform, tekst_nl, tekst_fr, tekst_en, media_url, media_id, link,
             gepubliceerd_op, actief, created_at, updated_at
      from social_posts
      order by gepubliceerd_op desc
    `) as unknown as PostRow[];
    return rows.map(toPost);
  });

const postSchema = z.object({
  tekstNl: z.string().max(2000).default(""),
  tekstFr: z.string().max(2000).default(""),
  tekstEn: z.string().max(2000).default(""),
  mediaUrl: z.string().max(2000).nullable().default(null),
  mediaId: z.string().uuid().nullable().default(null),
  link: z.string().max(2000).default(""),
  gepubliceerdOp: z.string().min(1),
  actief: z.boolean().default(true),
});

/** Nieuw eigen bericht aanmaken. */
export const createSocialPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => postSchema.parse(d))
  .handler(async ({ data, context }): Promise<SocialPost> => {
    await requirePermission(context, "manage_media");
    const { ensureSocialTables } = await import("@/lib/social-admin.server");
    await ensureSocialTables();
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      insert into social_posts
        (platform, tekst_nl, tekst_fr, tekst_en, media_url, media_id, link, gepubliceerd_op, actief, created_by)
      values
        ('eigen', ${data.tekstNl}, ${data.tekstFr}, ${data.tekstEn}, ${data.mediaUrl}, ${data.mediaId},
         ${data.link}, ${data.gepubliceerdOp}, ${data.actief}, ${email})
      returning id, platform, tekst_nl, tekst_fr, tekst_en, media_url, media_id, link,
                gepubliceerd_op, actief, created_at, updated_at
    `) as unknown as PostRow[];
    const row = rows[0];
    if (!row) throw new Error("Aanmaken mislukt — geen databaseverbinding.");
    return toPost(row);
  });

/* ------------------------- Permanent verwijderen op Bluesky ------------------------- */

const hardDeleteBlueskySchema = z.object({ postUri: z.string().trim().min(1).max(500) });

/**
 * Verwijdert een Bluesky-post definitief via de AT Protocol-API
 * (com.atproto.repo.deleteRecord), met een app-wachtwoord uit de environment.
 * Ruimt nadien ook een eventuele "verberg"-rij op.
 */
export const hardDeleteBlueskyPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => hardDeleteBlueskySchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_media");

    const identifier = process.env.BSKY_IDENTIFIER;
    const password = process.env.BSKY_APP_PASSWORD;
    if (!identifier || !password) {
      throw new Error(
        "BSKY_IDENTIFIER en BSKY_APP_PASSWORD zijn niet ingesteld — permanent verwijderen op Bluesky is niet mogelijk.",
      );
    }

    const { createBlueskySession, deleteBlueskyRecord, rkeyFromUri } = await import("@/lib/bluesky");
    const session = await createBlueskySession(identifier, password);
    const rkey = rkeyFromUri(data.postUri);
    await deleteBlueskyRecord({ accessJwt: session.accessJwt, did: session.did, rkey });

    const { ensureSocialTablesQuiet } = await import("@/lib/social-admin.server");
    await ensureSocialTablesQuiet();
    const { db } = await import("@/lib/neon.server");
    await db()`delete from social_hidden_posts where platform = 'bluesky' and post_id = ${data.postUri}`;

    return { ok: true };
  });

/** Eigen bericht bijwerken. */
export const updateSocialPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => postSchema.extend({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }): Promise<SocialPost> => {
    await requirePermission(context, "manage_media");
    const { ensureSocialTables } = await import("@/lib/social-admin.server");
    await ensureSocialTables();
    const { db } = await import("@/lib/neon.server");
    const rows = (await db()`
      update social_posts set
        tekst_nl = ${data.tekstNl},
        tekst_fr = ${data.tekstFr},
        tekst_en = ${data.tekstEn},
        media_url = ${data.mediaUrl},
        media_id = ${data.mediaId},
        link = ${data.link},
        gepubliceerd_op = ${data.gepubliceerdOp},
        actief = ${data.actief},
        updated_at = now()
      where id = ${data.id}::bigint
      returning id, platform, tekst_nl, tekst_fr, tekst_en, media_url, media_id, link,
                gepubliceerd_op, actief, created_at, updated_at
    `) as unknown as PostRow[];
    const row = rows[0];
    if (!row) throw new Error("Dit bericht bestaat niet meer.");
    return toPost(row);
  });

/** Eigen bericht verwijderen. */
export const deleteSocialPost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_media");
    const { ensureSocialTables } = await import("@/lib/social-admin.server");
    await ensureSocialTables();
    const { db } = await import("@/lib/neon.server");
    await db()`delete from social_posts where id = ${data.id}::bigint`;
    return { ok: true };
  });
