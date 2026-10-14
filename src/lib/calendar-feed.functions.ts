/**
 * Persoonlijke iCal-feed van een medewerker: token ophalen, filters bewaren en
 * het token vernieuwen wanneer de link per ongeluk gedeeld werd.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import { safeError } from "@/lib/safe-error";

export type FeedSettings = {
  token: string;
  includeAssigned: boolean;
  includeSchools: boolean;
  includeAll: boolean;
};

async function sql() {
  const { db } = await import("./neon.server");
  return db();
}

function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

type Row = {
  token: string;
  include_assigned: boolean;
  include_schools: boolean;
  include_all: boolean;
};

const shape = (r: Row): FeedSettings => ({
  token: r.token,
  includeAssigned: r.include_assigned,
  includeSchools: r.include_schools,
  includeAll: r.include_all,
});

type Db = Awaited<ReturnType<typeof sql>>;

/**
 * De agenda-feed hangt met een sleutel aan `profiles`. Het login-account en het
 * profiel worden apart aangemaakt, dus zoeken we het echte profiel op (op id of
 * op e-mailadres) en maken we het zo nodig zelfherstellend aan. Zonder deze stap
 * botst het bewaren van de agendalink op een sleutelconflict.
 */
async function resolveProfileId(db: Db, userId: string, email?: string | null): Promise<string> {
  const byId = (await db`select id from profiles where id = ${userId}::uuid limit 1`) as Array<{
    id: string;
  }>;
  if (byId[0]) return byId[0].id;

  const mail = email?.trim().toLowerCase();
  if (mail) {
    const byMail = (await db`
      select id from profiles where lower(email) = ${mail} limit 1
    `) as Array<{ id: string }>;
    if (byMail[0]) return byMail[0].id;
  }

  const created = (await db`
    insert into profiles (id, email, full_name, active, updated_at)
    values (${userId}::uuid, ${mail ?? null}, ${mail ? mail.split("@")[0] : null}, true, now())
    on conflict (id) do update set updated_at = now()
    returning id
  `) as Array<{ id: string }>;
  if (!created[0]) throw new Error("Geen profiel gevonden.");
  return created[0].id;
}

/** Profiel-id van de ingelogde medewerker, zelfherstellend. */
async function currentProfileId(context: unknown, db: Db): Promise<string> {
  const ctx = context as { userId?: string; claims?: { email?: string } | null };
  if (!ctx.userId) throw new Error("Geen profiel gevonden.");
  return resolveProfileId(db, ctx.userId, ctx.claims?.email ?? null);
}

/** Huidige feedinstellingen ophalen; maakt bij de eerste keer een token aan. */
export const getMyCalendarFeed = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<FeedSettings> => {
    try {
      await requirePermission(context, "view_calendar");
      const db = await sql();
      const profileId = await currentProfileId(context, db);
      const rows = (await db`
        insert into calendar_feed_tokens (profile_id, token)
        values (${profileId}::uuid, ${newToken()})
        on conflict (profile_id) do update set updated_at = now()
        returning token, include_assigned, include_schools, include_all
      `) as Row[];
      if (!rows[0]) throw new Error("De agenda-feed kon niet aangemaakt worden.");
      return shape(rows[0]);
    } catch (error) {
      throw safeError(error, "De agenda-feed kon niet geladen worden.");
    }
  });

/** Filters van de persoonlijke feed bewaren. */
export const saveCalendarFeedFilters = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        includeAssigned: z.boolean(),
        includeSchools: z.boolean(),
        includeAll: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<FeedSettings> => {
    try {
      await requirePermission(context, "view_calendar");
      const db = await sql();
      const profileId = await currentProfileId(context, db);
      const rows = (await db`
        insert into calendar_feed_tokens (profile_id, token, include_assigned, include_schools, include_all)
        values (${profileId}::uuid, ${newToken()}, ${data.includeAssigned}, ${data.includeSchools}, ${data.includeAll})
        on conflict (profile_id) do update set
          include_assigned = excluded.include_assigned,
          include_schools = excluded.include_schools,
          include_all = excluded.include_all,
          updated_at = now()
        returning token, include_assigned, include_schools, include_all
      `) as Row[];
      if (!rows[0]) throw new Error("Nog geen feed aangemaakt.");
      return shape(rows[0]);
    } catch (error) {
      throw safeError(error, "De feedinstellingen konden niet bewaard worden.");
    }
  });

/** Token vernieuwen: de oude link werkt daarna niet meer. */
export const rotateCalendarFeedToken = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<FeedSettings> => {
    try {
      await requirePermission(context, "view_calendar");
      const db = await sql();
      const profileId = await currentProfileId(context, db);
      const rows = (await db`
        insert into calendar_feed_tokens (profile_id, token)
        values (${profileId}::uuid, ${newToken()})
        on conflict (profile_id) do update set token = excluded.token, updated_at = now()
        returning token, include_assigned, include_schools, include_all
      `) as Row[];
      if (!rows[0]) throw new Error("De agenda-feed kon niet aangemaakt worden.");
      return shape(rows[0]);
    } catch (error) {
      throw safeError(error, "Het token kon niet vernieuwd worden.");
    }
  });

/** Agendalink volledig wissen; een nieuwe link kan altijd opnieuw aangemaakt worden. */
export const clearCalendarFeed = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    try {
      await requirePermission(context, "view_calendar");
      const db = await sql();
      const ctx = context as { userId?: string; claims?: { email?: string } | null };
      if (!ctx.userId) throw new Error("Geen profiel gevonden.");
      // Wissen mag nooit stukvallen op ontbrekende profielen: verwijder zowel op
      // het login-id als op het gekoppelde profiel-id.
      await db`delete from calendar_feed_tokens where profile_id = ${ctx.userId}::uuid`;
      const mail = ctx.claims?.email?.trim().toLowerCase();
      if (mail) {
        await db`
          delete from calendar_feed_tokens
          where profile_id in (select id from profiles where lower(email) = ${mail})
        `;
      }
      return { ok: true };
    } catch (error) {
      throw safeError(error, "De agendalink kon niet gewist worden.");
    }
  });
