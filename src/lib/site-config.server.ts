/**
 * Server-only laag voor het sitebeheer: zorgt dat de tabellen bestaan en
 * leest de volledige siteconfiguratie in één keer.
 */
import {
  DEFAULT_SITE_CONFIG,
  EMPTY_TEXT,
  FEATURE_LABELS,
  type Maintenance,
  type SiteAnnouncement,
  type SiteConfig,
  type SiteContact,
  DEFAULT_SITE_CONTACT,
  type SitePage,
  type PageStatus,
  type SocialLink,
  DEFAULT_SOCIAL_LINKS,
} from "./site-config";
import { parseChatSettings, parsePaymentSettings } from "@/types/settings";

type PageRow = {
  key: string;
  status: string;
  visible_from: string | null;
  visible_to: string | null;
  notice_nl: string | null;
  notice_fr: string | null;
  notice_en: string | null;
};

type AnnouncementRow = {
  id: string;
  active: boolean;
  tone: string;
  message_nl: string | null;
  message_fr: string | null;
  message_en: string | null;
  link_url: string | null;
  link_label_nl: string | null;
  link_label_fr: string | null;
  link_label_en: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

let ensured = false;

/** Maakt de tabellen aan wanneer ze nog niet bestaan (idempotent). */
export async function ensureSiteTables(): Promise<boolean> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return false;
  if (ensured) return true;
  const sql = db();
  await sql`
    create table if not exists site_pages (
      key text primary key,
      status text not null default 'visible',
      visible_from timestamptz,
      visible_to timestamptz,
      notice_nl text,
      notice_fr text,
      notice_en text,
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  await sql`
    create table if not exists site_settings (
      key text primary key,
      value jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  await sql`
    create table if not exists feature_flags (
      key text primary key,
      enabled boolean not null default true,
      label text,
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  await sql`
    create table if not exists site_announcements (
      id uuid primary key default gen_random_uuid(),
      active boolean not null default false,
      tone text not null default 'info',
      message_nl text not null default '',
      message_fr text not null default '',
      message_en text not null default '',
      link_url text,
      link_label_nl text,
      link_label_fr text,
      link_label_en text,
      starts_at timestamptz,
      ends_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  for (const [key, label] of Object.entries(FEATURE_LABELS)) {
    await sql`
      insert into feature_flags (key, label) values (${key}, ${label})
      on conflict (key) do nothing
    `;
  }
  ensured = true;
  return true;
}

function toPage(row: PageRow): SitePage {
  const status: PageStatus =
    row.status === "hidden" || row.status === "offline" ? row.status : "visible";
  return {
    key: row.key,
    status,
    visibleFrom: row.visible_from,
    visibleTo: row.visible_to,
    notice: {
      nl: row.notice_nl ?? "",
      fr: row.notice_fr ?? "",
      en: row.notice_en ?? "",
    },
  };
}

function toAnnouncement(row: AnnouncementRow): SiteAnnouncement {
  return {
    id: row.id,
    active: row.active,
    tone: row.tone === "warning" || row.tone === "success" ? row.tone : "info",
    message: {
      nl: row.message_nl ?? "",
      fr: row.message_fr ?? "",
      en: row.message_en ?? "",
    },
    linkUrl: row.link_url,
    linkLabel: {
      nl: row.link_label_nl ?? "",
      fr: row.link_label_fr ?? "",
      en: row.link_label_en ?? "",
    },
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

/** Volledige configuratie; bij elke fout valt alles terug op "alles open". */
export async function loadSiteConfig(): Promise<SiteConfig> {
  try {
    const ok = await ensureSiteTables();
    if (!ok) return DEFAULT_SITE_CONFIG;
    const { db } = await import("./neon.server");
    const sql = db();

    const [pages, flags, settings, announcements] = await Promise.all([
      sql`select key, status, visible_from, visible_to, notice_nl, notice_fr, notice_en from site_pages` as unknown as Promise<PageRow[]>,
      sql`select key, enabled from feature_flags` as unknown as Promise<{ key: string; enabled: boolean }[]>,
      sql`select key, value from site_settings where key in ('maintenance', 'contact', 'social_links', 'chat', 'payments')` as unknown as Promise<
        { key: string; value: unknown }[]
      >,
      sql`
        select id, active, tone, message_nl, message_fr, message_en, link_url,
               link_label_nl, link_label_fr, link_label_en, starts_at, ends_at
        from site_announcements
        where active
        order by updated_at desc
        limit 1
      ` as unknown as Promise<AnnouncementRow[]>,
    ]);

    const pageMap: Record<string, SitePage> = {};
    for (const row of pages) pageMap[row.key] = toPage(row);

    const features: Record<string, boolean> = { ...DEFAULT_SITE_CONFIG.features };
    for (const f of flags) features[f.key] = f.enabled;

    const rawOf = (key: string) =>
      (settings.find((s) => s.key === key)?.value ?? {}) as Record<string, unknown>;
    const raw = rawOf("maintenance");
    const c = rawOf("contact");
    const text = (v: unknown, fallback: string) => {
      const s = typeof v === "string" ? v.trim() : "";
      return s || fallback;
    };
    const contact: SiteContact = {
      address: text(c["address"], DEFAULT_SITE_CONTACT.address),
      postalCode: text(c["postal_code"], DEFAULT_SITE_CONTACT.postalCode),
      city: text(c["city"], DEFAULT_SITE_CONTACT.city),
      phone: text(c["phone"], DEFAULT_SITE_CONTACT.phone),
      email: text(c["email"], DEFAULT_SITE_CONTACT.email),
      facebookUrl: text(c["facebook_url"], DEFAULT_SITE_CONTACT.facebookUrl),
      instagramUrl: text(c["instagram_url"], DEFAULT_SITE_CONTACT.instagramUrl),
      linkedinUrl: typeof c["linkedin_url"] === "string" ? (c["linkedin_url"] as string) : "",
    };
    function toSocialLinks(raw: unknown): SocialLink[] {
      if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SOCIAL_LINKS;
      try {
        const links: SocialLink[] = raw.map((r, i) => {
          const o = r as Record<string, unknown>;
          return {
            id: String(o.id ?? ""),
            name: String(o.name ?? ""),
            url: typeof o.url === "string" ? o.url : "",
            active: o.active === true,
            order: typeof o.order === "number" ? o.order : i,
          };
        });
        return links.every((l) => l.id) ? links : DEFAULT_SOCIAL_LINKS;
      } catch {
        return DEFAULT_SOCIAL_LINKS;
      }
    }
    const socialLinksRaw = settings.find((s) => s.key === "social_links")?.value;
    const socialLinks = toSocialLinks(socialLinksRaw);

    const maintenance: Maintenance = {
      enabled: raw["enabled"] === true,
      message: {
        nl: String(raw["message_nl"] ?? ""),
        fr: String(raw["message_fr"] ?? ""),
        en: String(raw["message_en"] ?? ""),
      },
    };

    return {
      pages: pageMap,
      contact,
      features,
      maintenance,
      announcement: announcements[0] ? toAnnouncement(announcements[0]) : null,
      socialLinks,
      chat: parseChatSettings(settings.find((s) => s.key === "chat")?.value),
      payments: parsePaymentSettings(settings.find((s) => s.key === "payments")?.value),
    };
  } catch (error) {
    console.error("[site-config] kon configuratie niet laden:", error);
    return {
      ...DEFAULT_SITE_CONFIG,
      maintenance: { enabled: false, message: { ...EMPTY_TEXT } },
      socialLinks: DEFAULT_SOCIAL_LINKS,
    };
  }
}
