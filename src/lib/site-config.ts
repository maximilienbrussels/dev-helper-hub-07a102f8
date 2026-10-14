/**
 * Sitebeheer — gedeelde types en pure logica.
 *
 * De publieke site leest één samengevatte configuratie (`SiteConfig`) met
 * pagina-zichtbaarheid, onderhoudsmodus, modules (feature flags) en de
 * aankondigingsbalk. Alles is fail-safe: zonder databank blijft de site
 * gewoon volledig zichtbaar.
 */
import type { Lang, PageKey } from "@/lib/routes-i18n";
import {
  DEFAULT_CHAT_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  type ChatSettings,
  type PaymentSettings,
} from "@/types/settings";

export type PageStatus = "visible" | "hidden" | "offline";

/** Pagina's die het team mag uitschakelen. De rest is altijd bereikbaar. */
export const MANAGEABLE_PAGES: PageKey[] = [
  "visit",
  "animals",
  "education",
  "animations",
  "camps",
  "rental",
  "teambuilding",
  "seminars",
  "compost",
  "support",
  "news",
  "about",
  "contact",
  "shop",
  "partners",
  "social",
  "faq",
  "events",
  "volunteers",
  "jobs",
  "press",
  "resources",
  "transparency",
  "academy",
  "pass",
];

export const PAGE_LABELS: Record<string, string> = {
  visit: "Bezoek",
  animals: "Dieren",
  education: "Educatie",
  animations: "Schoolanimaties",
  camps: "Vakantiestages",
  rental: "Verhuur",
  teambuilding: "Teambuilding",
  seminars: "Seminaries",
  compost: "Compost",
  support: "Steun ons",
  news: "Nieuws",
  about: "Over ons",
  contact: "Contact",
  shop: "Webshop",
  partners: "Partners",
  social: "Sociaal",
  faq: "FAQ",
  events: "Evenementen",
  volunteers: "Vrijwilligers",
  jobs: "Vacatures",
  press: "Pers & mediakit",
  resources: "Bronnen",
  transparency: "Transparantie",
  academy: "Academie",
  pass: "Mijn Hoefjes",
};

export type FeatureKey =
  | "shop"
  | "booking"
  | "academy_quiz"
  | "chatbot"
  | "social_feeds"
  | "registration";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  shop: "Webshop & winkelmandje",
  booking: "Online boeken",
  academy_quiz: "Academie-quiz",
  chatbot: "Chatbot",
  social_feeds: "Social feeds",
  registration: "Registratie van nieuwe accounts",
};

export type SitePage = {
  key: string;
  status: PageStatus;
  visibleFrom: string | null;
  visibleTo: string | null;
  notice: { nl: string; fr: string; en: string };
};

export type SiteAnnouncement = {
  id: string;
  active: boolean;
  tone: "info" | "warning" | "success";
  message: { nl: string; fr: string; en: string };
  linkUrl: string | null;
  linkLabel: { nl: string; fr: string; en: string };
  startsAt: string | null;
  endsAt: string | null;
};

export type Maintenance = {
  enabled: boolean;
  message: { nl: string; fr: string; en: string };
};

/** Centrale contactgegevens: adres, telefoon, e-mail en socials. */
export type SiteContact = {
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
};

export const DEFAULT_SITE_CONTACT: SiteContact = {
  address: "Schipperijkaai 2",
  postalCode: "1000",
  city: "Brussel",
  phone: "+32 2 201 56 09",
  email: "contact@maximilien.brussels",
  facebookUrl: "https://www.facebook.com/fermeduparcmaximilien",
  instagramUrl: "https://www.instagram.com/fermeduparcmaximilien",
  linkedinUrl: "",
};

/** Volledig adres op één lijn. */
export function contactAddressLine(c: SiteContact): string {
  return [c.address, [c.postalCode, c.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

/** Eén social-mediakanaal: kan aan/uit en herordend worden. */
export type SocialLink = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  order: number;
};

/**
 * Standaardkanalen van de boerderij — dezelfde set als SOCIAL_CHANNELS in
 * email-shell.ts en socialPlatforms in SocialCarousel.tsx, zodat er niets
 * verdwijnt zolang de databank leeg is.
 */
export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { id: "facebook", name: "Facebook", url: "https://facebook.com/maximilienbrussels", active: true, order: 0 },
  { id: "instagram", name: "Instagram", url: "https://instagram.com/maximilienbrussels", active: true, order: 1 },
  { id: "linkedin", name: "LinkedIn", url: "https://linkedin.com/company/maximilienbrussels", active: true, order: 2 },
  { id: "tiktok", name: "TikTok", url: "https://tiktok.com/@maximilienbrussels", active: false, order: 3 },
  { id: "whatsapp", name: "WhatsApp", url: "https://wa.me/32220156090", active: false, order: 4 },
  { id: "youtube", name: "YouTube", url: "https://youtube.com/@maximilienbrussels", active: true, order: 5 },
  { id: "x", name: "X", url: "https://x.com/maximilienbrussels", active: false, order: 6 },
  { id: "bluesky", name: "Bluesky", url: "https://bsky.app/profile/maximilien.brussels", active: true, order: 7 },
  { id: "mastodon", name: "Mastodon", url: "https://mastodon.social/@maximilienbrussels", active: true, order: 8 },
  { id: "peertube", name: "PeerTube", url: "https://peertube.be/c/maximilienbrussels", active: true, order: 9 },
  { id: "pinterest", name: "Pinterest", url: "https://pinterest.com/maximilienbrussels", active: true, order: 10 },
  { id: "wsocial", name: "WSocial", url: "https://wsocial.com/maximilienbrussels", active: true, order: 11 },
  { id: "discord", name: "Discord", url: "https://discord.gg/maximilienbrussels", active: true, order: 12 },
  { id: "eyou", name: "eYou", url: "https://eyou.com/maximilienbrussels", active: true, order: 13 },
  { id: "github", name: "GitHub", url: "https://github.com/maximilienbrussels", active: true, order: 14 },
];

/** Actieve kanalen, gesorteerd op volgorde — pure functie voor UI en mails. */
export function activeSocialLinks(config: SiteConfig | null | undefined): SocialLink[] {
  const links = config?.socialLinks?.length ? config.socialLinks : DEFAULT_SOCIAL_LINKS;
  return links
    .filter((l) => l.active)
    .slice()
    .sort((a, b) => a.order - b.order);
}

export type SiteConfig = {
  pages: Record<string, SitePage>;
  contact: SiteContact;
  features: Record<string, boolean>;
  maintenance: Maintenance;
  announcement: SiteAnnouncement | null;
  socialLinks: SocialLink[];
  chat: ChatSettings;
  payments: PaymentSettings;
};

export const EMPTY_TEXT = { nl: "", fr: "", en: "" };

/** Volledig open configuratie — vangnet zonder databank. */
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  pages: {},
  contact: { ...DEFAULT_SITE_CONTACT },
  features: {
    shop: true,
    booking: true,
    academy_quiz: true,
    chatbot: true,
    social_feeds: true,
    registration: true,
  },
  maintenance: { enabled: false, message: { ...EMPTY_TEXT } },
  announcement: null,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  chat: { ...DEFAULT_CHAT_SETTINGS },
  payments: { ...DEFAULT_PAYMENT_SETTINGS },
};

function withinWindow(from: string | null, to: string | null, now: Date): boolean {
  if (from && now < new Date(from)) return false;
  if (to && now > new Date(to)) return false;
  return true;
}

/**
 * Werkelijke status van een pagina op dit moment: buiten het geplande venster
 * geldt de ingestelde status, erbinnen is de pagina gewoon zichtbaar.
 */
export function effectivePageStatus(
  config: SiteConfig | null | undefined,
  key: string,
  now: Date = new Date(),
): PageStatus {
  const page = config?.pages?.[key];
  if (!page || page.status === "visible") return "visible";
  // Een venster betekent: de afwijkende status geldt enkel binnen dat venster.
  if ((page.visibleFrom || page.visibleTo) && !withinWindow(page.visibleFrom, page.visibleTo, now)) {
    return "visible";
  }
  return page.status;
}

export function isPageAvailable(
  config: SiteConfig | null | undefined,
  key: string,
  now: Date = new Date(),
): boolean {
  return effectivePageStatus(config, key, now) === "visible";
}

export function isFeatureEnabled(
  config: SiteConfig | null | undefined,
  key: FeatureKey,
): boolean {
  const value = config?.features?.[key];
  return value === undefined ? true : value;
}

/** Aankondiging die nu getoond mag worden, of null. */
export function activeAnnouncement(
  config: SiteConfig | null | undefined,
  lang: Lang,
  now: Date = new Date(),
): { message: string; linkLabel: string; linkUrl: string | null; tone: SiteAnnouncement["tone"] } | null {
  const a = config?.announcement;
  if (!a || !a.active) return null;
  if (!withinWindow(a.startsAt, a.endsAt, now)) return null;
  const message = a.message[lang] || a.message.nl || a.message.fr || a.message.en;
  if (!message.trim()) return null;
  return {
    message,
    linkLabel: a.linkLabel[lang] || a.linkLabel.nl || "",
    linkUrl: a.linkUrl,
    tone: a.tone,
  };
}

export function pageNotice(
  config: SiteConfig | null | undefined,
  key: string,
  lang: Lang,
): string {
  const n = config?.pages?.[key]?.notice;
  if (!n) return "";
  return n[lang] || n.nl || n.fr || n.en || "";
}
