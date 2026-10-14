/**
 * Openbaar profiel: instellingen (eigenaar), publieke weergave en volgen.
 * De publieke weergave geeft enkel velden terug die de eigenaar zichtbaar zette.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";

const settingsSchema = z.object({
  is_public: z.boolean(),
  show_name: z.boolean(),
  show_timeline: z.boolean(),
  show_badges: z.boolean(),
  show_certificates: z.boolean(),
  show_hooi: z.boolean(),
  show_follows: z.boolean(),
  bio: z.string().trim().max(280).nullable(),
});
export type ProfileSettings = z.infer<typeof settingsSchema> & { public_id: string };

export const getMyProfileSettings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<ProfileSettings> => {
    const { ensureProfile } = await import("./public-profile.server");
    const p = await ensureProfile(context.userId);
    return {
      public_id: p.public_id,
      is_public: p.is_public,
      show_name: p.show_name,
      show_timeline: p.show_timeline,
      show_badges: p.show_badges,
      show_certificates: p.show_certificates,
      show_hooi: p.show_hooi,
      show_follows: p.show_follows,
      bio: p.bio,
    };
  });

export const updateMyProfileSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { ensureProfile } = await import("./public-profile.server");
    const { db } = await import("./neon.server");
    await ensureProfile(context.userId);
    await db()`
      update public.app_public_profiles set
        is_public = ${data.is_public}, show_name = ${data.show_name}, show_timeline = ${data.show_timeline},
        show_badges = ${data.show_badges}, show_certificates = ${data.show_certificates},
        show_hooi = ${data.show_hooi}, show_follows = ${data.show_follows},
        bio = ${data.bio || null}, updated_at = now()
      where user_id = ${context.userId}::uuid`;
    return { ok: true };
  });

export type TimelineItem =
  | { kind: "certificate"; date: string; academy: Record<"nl" | "fr" | "en", string>; code: string | null; icon: string | null }
  | { kind: "joined"; date: string };

export type PublicProfile =
  | { status: "not_found" }
  | { status: "private"; publicId: string }
  | {
      status: "ok";
      publicId: string;
      name: string | null;
      avatarUrl: string | null;
      bio: string | null;
      memberSince: string;
      followers: number | null;
      following: number | null;
      hooi: number | null;
      certificates: Array<{ academy: Record<"nl" | "fr" | "en", string>; code: string | null; icon: string | null; date: string }> | null;
      badges: { total: number; achieved: string[] } | null;
      timeline: TimelineItem[] | null;
    };

/** Publiek: iedereen mag dit oproepen; geeft nooit e-mail, telefoon of adres terug. */
export const getPublicProfile = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ id: z.string().trim().toLowerCase().regex(/^[a-z2-9]{10}$/) }).parse(d))
  .handler(async ({ data }): Promise<PublicProfile> => {
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return { status: "not_found" };
    const rows = (await db()`
      select p.*, u.name as u_name, u.avatar_url as u_avatar, u.created_at as u_created,
             pr.first_name, pr.avatar_url as pr_avatar, pr.hoefjes_balance
        from public.app_public_profiles p
        join public.app_users u on u.id = p.user_id
        left join public.profiles pr on pr.id = p.user_id
       where p.public_id = ${data.id}
       limit 1`) as Array<Record<string, unknown>>;
    const r = rows[0];
    if (!r) return { status: "not_found" };
    if (!r.is_public) return { status: "private", publicId: data.id };

    const uid = String(r.user_id);
    const certRows = r.show_certificates || r.show_badges || r.show_timeline
      ? ((await db()`
          select c.short_code, c.behaald_op, a.id as academy_id, a.diersoort_naam, a.diersoort_naam_fr, a.diersoort_naam_en, a.badge_icon
            from certificaten c join academies a on a.id = c.academy_id
           where c.user_id = ${uid}::uuid
           order by c.behaald_op desc limit 100`) as Array<Record<string, unknown>>)
      : [];
    const certs = certRows.map((c) => ({
      academy: {
        nl: String(c.diersoort_naam ?? ""),
        fr: String(c.diersoort_naam_fr || c.diersoort_naam || ""),
        en: String(c.diersoort_naam_en || c.diersoort_naam || ""),
      },
      code: (c.short_code as string | null) ?? null,
      icon: (c.badge_icon as string | null) ?? null,
      date: new Date(c.behaald_op as string).toISOString(),
      academyId: String(c.academy_id),
    }));

    let followers: number | null = null;
    let following: number | null = null;
    if (r.show_follows) {
      const f = (await db()`
        select (select count(*)::int from public.app_follows where followee_id = ${uid}::uuid) as followers,
               (select count(*)::int from public.app_follows where follower_id = ${uid}::uuid) as following`) as Array<{ followers: number; following: number }>;
      followers = f[0]?.followers ?? 0;
      following = f[0]?.following ?? 0;
    }

    let badges: { total: number; achieved: string[] } | null = null;
    if (r.show_badges) {
      const t = (await db()`select count(*)::int as n from academies where is_active`) as Array<{ n: number }>;
      badges = { total: t[0]?.n ?? 0, achieved: [...new Set(certs.map((c) => c.academyId))] };
    }

    const memberSince = new Date(r.u_created as string).toISOString();
    const timeline: TimelineItem[] | null = r.show_timeline
      ? [
          ...certs.map((c) => ({ kind: "certificate" as const, date: c.date, academy: c.academy, code: c.code, icon: c.icon })),
          { kind: "joined" as const, date: memberSince },
        ]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 50)
      : null;

    const name = r.show_name ? ((r.first_name as string) || (r.u_name as string) || null) : null;
    return {
      status: "ok",
      publicId: data.id,
      name: name ? name.split(" ")[0] : null,
      avatarUrl: r.show_name ? ((r.pr_avatar as string) || (r.u_avatar as string) || null) : null,
      bio: (r.bio as string) || null,
      memberSince,
      followers,
      following,
      hooi: r.show_hooi ? Number(r.hoefjes_balance ?? 0) : null,
      certificates: r.show_certificates ? certs.map(({ academyId: _a, ...c }) => c) : null,
      badges,
      timeline,
    };
  });

async function targetUser(publicId: string): Promise<{ userId: string; isPublic: boolean } | null> {
  const { db } = await import("./neon.server");
  const rows = (await db()`select user_id, is_public from public.app_public_profiles where public_id = ${publicId}`) as Array<{ user_id: string; is_public: boolean }>;
  return rows[0] ? { userId: String(rows[0].user_id), isPublic: rows[0].is_public } : null;
}

const idSchema = z.object({ id: z.string().trim().toLowerCase().regex(/^[a-z2-9]{10}$/) });

export const getFollowState = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const t = await targetUser(data.id);
    if (!t) return { self: false, following: false };
    if (t.userId === context.userId) return { self: true, following: false };
    const { db } = await import("./neon.server");
    const r = (await db()`select 1 from public.app_follows where follower_id = ${context.userId}::uuid and followee_id = ${t.userId}::uuid`) as unknown[];
    return { self: false, following: r.length > 0 };
  });

export const setFollow = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => idSchema.extend({ follow: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { checkRateLimit } = await import("./rate-limit.server");
    if (!(await checkRateLimit("follow", context.userId, 60, 3600))) throw new Error("Even geduld — probeer het straks opnieuw.");
    const t = await targetUser(data.id);
    if (!t || !t.isPublic) throw new Error("Dit profiel kan je niet volgen.");
    if (t.userId === context.userId) throw new Error("Je kan jezelf niet volgen.");
    const { db } = await import("./neon.server");
    if (data.follow) {
      await db()`insert into public.app_follows (follower_id, followee_id) values (${context.userId}::uuid, ${t.userId}::uuid) on conflict do nothing`;
    } else {
      await db()`delete from public.app_follows where follower_id = ${context.userId}::uuid and followee_id = ${t.userId}::uuid`;
    }
    return { following: data.follow };
  });
