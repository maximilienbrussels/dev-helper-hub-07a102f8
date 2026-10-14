/**
 * Serverfuncties voor het sitebeheer in het portaal.
 *
 * Publiek: `fetchSiteConfig` (leesbaar zonder login, want de site zelf
 * heeft die configuratie nodig). Beheer: alles achter `manage_settings`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "./portal-permissions";
import { recordAudit } from "./audit.server";
import { DEFAULT_SITE_CONFIG, type SiteAnnouncement, type SiteConfig } from "./site-config";

function actorEmail(context: unknown): string | null {
  return ((context as { claims?: { email?: string } | null })?.claims?.email as string) ?? null;
}

/* ------------------------------ publiek ------------------------------- */

/** Volledige siteconfiguratie voor de publieke site (fail-safe). */
export const fetchSiteConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteConfig> => {
    try {
      const { loadSiteConfig } = await import("./site-config.server");
      return await loadSiteConfig();
    } catch {
      return DEFAULT_SITE_CONFIG;
    }
  },
);

/* ------------------------------- beheer -------------------------------- */

const pageSchema = z.object({
  key: z.string().min(1).max(60),
  status: z.enum(["visible", "hidden", "offline"]),
  visibleFrom: z.string().nullable().default(null),
  visibleTo: z.string().nullable().default(null),
  noticeNl: z.string().max(600).default(""),
  noticeFr: z.string().max(600).default(""),
  noticeEn: z.string().max(600).default(""),
});

/** Zichtbaarheid van één publieke pagina bewaren. */
export const saveSitePage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => pageSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_settings");
    const { ensureSiteTables } = await import("./site-config.server");
    if (!(await ensureSiteTables())) throw new Error("Geen databaseverbinding.");
    const { db } = await import("./neon.server");
    const email = actorEmail(context);
    await db()`
      insert into site_pages (key, status, visible_from, visible_to, notice_nl, notice_fr, notice_en, updated_at, updated_by)
      values (
        ${data.key}, ${data.status},
        ${data.visibleFrom || null}::timestamptz, ${data.visibleTo || null}::timestamptz,
        ${data.noticeNl}, ${data.noticeFr}, ${data.noticeEn}, now(), ${email}
      )
      on conflict (key) do update set
        status = excluded.status,
        visible_from = excluded.visible_from,
        visible_to = excluded.visible_to,
        notice_nl = excluded.notice_nl,
        notice_fr = excluded.notice_fr,
        notice_en = excluded.notice_en,
        updated_at = now(),
        updated_by = excluded.updated_by
    `;
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "site_page",
      entityId: data.key,
      summary: `Pagina ${data.key} → ${data.status}`,
      details: data,
    });
    return { ok: true };
  });

const flagSchema = z.object({ key: z.string().min(1).max(60), enabled: z.boolean() });

/** Module (feature flag) aan- of uitzetten. */
export const saveFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => flagSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_settings");
    const { ensureSiteTables } = await import("./site-config.server");
    if (!(await ensureSiteTables())) throw new Error("Geen databaseverbinding.");
    const { db } = await import("./neon.server");
    const email = actorEmail(context);
    await db()`
      insert into feature_flags (key, enabled, updated_at, updated_by)
      values (${data.key}, ${data.enabled}, now(), ${email})
      on conflict (key) do update set enabled = excluded.enabled, updated_at = now(), updated_by = excluded.updated_by
    `;
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "feature_flag",
      entityId: data.key,
      summary: `Module ${data.key} ${data.enabled ? "aan" : "uit"}`,
    });
    return { ok: true };
  });

const maintenanceSchema = z.object({
  enabled: z.boolean(),
  messageNl: z.string().max(1000).default(""),
  messageFr: z.string().max(1000).default(""),
  messageEn: z.string().max(1000).default(""),
});

/** Onderhoudsmodus voor de publieke site. */
export const saveMaintenance = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => maintenanceSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_settings");
    const { ensureSiteTables } = await import("./site-config.server");
    if (!(await ensureSiteTables())) throw new Error("Geen databaseverbinding.");
    const { db } = await import("./neon.server");
    const email = actorEmail(context);
    const value = JSON.stringify({
      enabled: data.enabled,
      message_nl: data.messageNl,
      message_fr: data.messageFr,
      message_en: data.messageEn,
    });
    await db()`
      insert into site_settings (key, value, updated_at, updated_by)
      values ('maintenance', ${value}::jsonb, now(), ${email})
      on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
    `;
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "site_setting",
      entityId: "maintenance",
      summary: `Onderhoudsmodus ${data.enabled ? "aan" : "uit"}`,
    });
    return { ok: true };
  });

const announcementSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  active: z.boolean().default(false),
  tone: z.enum(["info", "warning", "success"]).default("info"),
  messageNl: z.string().max(600).default(""),
  messageFr: z.string().max(600).default(""),
  messageEn: z.string().max(600).default(""),
  linkUrl: z.string().max(500).nullable().default(null),
  linkLabelNl: z.string().max(120).default(""),
  linkLabelFr: z.string().max(120).default(""),
  linkLabelEn: z.string().max(120).default(""),
  startsAt: z.string().nullable().default(null),
  endsAt: z.string().nullable().default(null),
});

/** Aankondigingsbalk bewaren (één actieve balk tegelijk). */
export const saveAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => announcementSchema.parse(d))
  .handler(async ({ data, context }): Promise<SiteAnnouncement> => {
    await requirePermission(context, "manage_settings");
    const { ensureSiteTables } = await import("./site-config.server");
    if (!(await ensureSiteTables())) throw new Error("Geen databaseverbinding.");
    const { db } = await import("./neon.server");
    const sql = db();
    const email = actorEmail(context);

    if (data.active) await sql`update site_announcements set active = false where active`;

    const rows = (await sql`
      insert into site_announcements (
        id, active, tone, message_nl, message_fr, message_en, link_url,
        link_label_nl, link_label_fr, link_label_en, starts_at, ends_at, updated_at, updated_by
      ) values (
        coalesce(${data.id}::uuid, gen_random_uuid()), ${data.active}, ${data.tone},
        ${data.messageNl}, ${data.messageFr}, ${data.messageEn}, ${data.linkUrl || null},
        ${data.linkLabelNl}, ${data.linkLabelFr}, ${data.linkLabelEn},
        ${data.startsAt || null}::timestamptz, ${data.endsAt || null}::timestamptz, now(), ${email}
      )
      on conflict (id) do update set
        active = excluded.active, tone = excluded.tone,
        message_nl = excluded.message_nl, message_fr = excluded.message_fr, message_en = excluded.message_en,
        link_url = excluded.link_url,
        link_label_nl = excluded.link_label_nl, link_label_fr = excluded.link_label_fr, link_label_en = excluded.link_label_en,
        starts_at = excluded.starts_at, ends_at = excluded.ends_at,
        updated_at = now(), updated_by = excluded.updated_by
      returning id, active, tone, message_nl, message_fr, message_en, link_url,
                link_label_nl, link_label_fr, link_label_en, starts_at, ends_at
    `) as unknown as Record<string, string | boolean | null>[];
    const row = rows[0];
    if (!row) throw new Error("Bewaren mislukt.");

    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "site_announcement",
      entityId: String(row.id),
      summary: `Aankondiging ${data.active ? "actief" : "inactief"}`,
    });

    return {
      id: String(row.id),
      active: Boolean(row.active),
      tone: data.tone,
      message: { nl: data.messageNl, fr: data.messageFr, en: data.messageEn },
      linkUrl: data.linkUrl || null,
      linkLabel: { nl: data.linkLabelNl, fr: data.linkLabelFr, en: data.linkLabelEn },
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    };
  });

/* -------------------- contactgegevens (site-breed) --------------------- */

const contactSchema = z.object({
  address: z.string().max(200).default(""),
  postalCode: z.string().max(20).default(""),
  city: z.string().max(120).default(""),
  phone: z.string().max(60).default(""),
  email: z.string().max(200).default(""),
  facebookUrl: z.string().max(300).default(""),
  instagramUrl: z.string().max(300).default(""),
  linkedinUrl: z.string().max(300).default(""),
});

/** Adres, telefoon, e-mail en socials — meteen zichtbaar op de hele site. */
export const saveSiteContact = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_settings");
    const { ensureSiteTables } = await import("./site-config.server");
    if (!(await ensureSiteTables())) throw new Error("Geen databaseverbinding.");
    const { db } = await import("./neon.server");
    const email = actorEmail(context);
    const value = {
      address: data.address,
      postal_code: data.postalCode,
      city: data.city,
      phone: data.phone,
      email: data.email,
      facebook_url: data.facebookUrl,
      instagram_url: data.instagramUrl,
      linkedin_url: data.linkedinUrl,
    };
    await db()`
      insert into site_settings (key, value, updated_at, updated_by)
      values ('contact', ${JSON.stringify(value)}::jsonb, now(), ${email})
      on conflict (key) do update set
        value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
    `;
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "site_settings",
      entityId: "contact",
      summary: "Contactgegevens bijgewerkt",
      details: value,
    });
    return { ok: true };
  });

/* -------------------------- social media-kanalen ------------------------ */

const socialLinkSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(60),
  url: z
    .string()
    .max(500)
    .refine(
      (v) => v === "" || /^https:\/\//i.test(v),
      "URL moet beginnen met https://",
    ),
  active: z.boolean(),
  order: z.number().int().min(0).max(999),
});

const socialLinksSchema = z.array(socialLinkSchema).max(60);

/** Alle social-mediakanalen (aan/uit, URL, volgorde) in één keer bewaren. */
export const saveSocialLinks = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => socialLinksSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_settings");
    const { ensureSiteTables } = await import("./site-config.server");
    if (!(await ensureSiteTables())) throw new Error("Geen databaseverbinding.");
    const { db } = await import("./neon.server");
    const email = actorEmail(context);
    await db()`
      insert into site_settings (key, value, updated_at, updated_by)
      values ('social_links', ${JSON.stringify(data)}::jsonb, now(), ${email})
      on conflict (key) do update set
        value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
    `;
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "site_settings",
      entityId: "social_links",
      summary: "Social-mediakanalen bijgewerkt",
      details: { count: data.length },
    });
    return { ok: true };
  });


const chatSettingsSchema = z.object({
  chatEnabled: z.boolean(),
  chatAiEnabled: z.boolean(),
  offlineMessage: z.string().max(400).default(""),
});

/** AI & chatbeheer: zichtbaarheid, motorkeuze en offlinebericht. */
export const saveChatSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => chatSettingsSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_settings");
    const { ensureSiteTables } = await import("./site-config.server");
    if (!(await ensureSiteTables())) throw new Error("Geen databaseverbinding.");
    const { db } = await import("./neon.server");
    const email = actorEmail(context);
    const value = {
      chat_enabled: data.chatEnabled,
      chat_ai_enabled: data.chatAiEnabled,
      offline_message: data.offlineMessage,
    };
    await db()`
      insert into site_settings (key, value, updated_at, updated_by)
      values ('chat', ${JSON.stringify(value)}::jsonb, now(), ${email})
      on conflict (key) do update set
        value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
    `;
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "site_settings",
      entityId: "chat",
      summary: "AI & chatinstellingen bijgewerkt",
      details: value,
    });
    return { ok: true };
  });

const paymentSettingsSchema = z.object({
  payOnPickupEnabled: z.boolean(),
  payOnPickupNotice: z.string().max(300).default(""),
});

/** Betaalinstellingen: "Betalen bij afhaling" aan/uit + instructietekst. */
export const savePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => paymentSettingsSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_settings");
    const { ensureSiteTables } = await import("./site-config.server");
    if (!(await ensureSiteTables())) throw new Error("Geen databaseverbinding.");
    const { db } = await import("./neon.server");
    const email = actorEmail(context);
    const value = {
      pay_on_pickup_enabled: data.payOnPickupEnabled,
      pay_on_pickup_notice: data.payOnPickupNotice,
    };
    await db()`
      insert into site_settings (key, value, updated_at, updated_by)
      values ('payments', ${JSON.stringify(value)}::jsonb, now(), ${email})
      on conflict (key) do update set
        value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
    `;
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "site_settings",
      entityId: "payments",
      summary: "Betaalinstellingen bijgewerkt",
      details: value,
    });
    return { ok: true };
  });
