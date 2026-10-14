/**
 * Gedeelde huisstijl-schil voor élke uitgaande mail (systeemmails én
 * teamsjablonen). Pure opmaak: geen secrets, geen netwerk — bruikbaar op de
 * server én in de browser (previews, HTML-download voor Infomaniak).
 *
 * Alle afbeeldingen zijn absolute URL's naar de live site (SITE_URL), zodat
 * logo en iconen ook laden wanneer de HTML los in een mailprogramma of in de
 * Infomaniak-nieuwsbrieftool geplakt wordt. Tabellen + inline styles: werkt in
 * Outlook, Gmail, Apple Mail en webmail.
 */
import { MAIL_COPY, type MailLang } from "./email-copy";
import { PUBLIC_SITE_URL, pathFor, type PageKey } from "./routes-i18n";
import { CONTACT_EMAIL } from "./contact-emails";
import { isCanonicalHost } from "./site-url";

/* --------------------------------- Merk ---------------------------------- */

export const BRAND_NAME = "Maximilien";
export const BRAND_TAGLINE: Record<MailLang, string> = {
  nl: "Stadsboerderij · Brussel",
  fr: "Ferme urbaine · Bruxelles",
  en: "City farm · Brussels",
};

type OrgInfo = {
  legalName: string;
  address: string;
  city: string;
  phone: string;
  phoneHref: string;
  email: string;
  vat: string;
};

export const ORG_DEFAULTS = {
  legalName: "Maximilien VZW / ASBL",
  address: "Schipperijkaai 2",
  city: "1000 Brussel / Bruxelles",
  phone: "+32 2 201 56 09",
  phoneHref: "tel:+3222015609",
  email: CONTACT_EMAIL,
  vat: "BE 0446.485.159",
} as const;

// Contactgegevens uit het portaal overschrijven de standaardwaarden zodra de
// server ze heeft geladen (zie applySiteContact).
let orgOverride: Partial<OrgInfo> = {};

// Logo/header-afbeeldingen uit het portaal (Co-Pilot of instellingen)
// overschrijven de standaard e-mailassets zodra de server ze heeft geladen.
let mailMediaOverride: { logoUrl?: string; headerImageUrl?: string } = {};

// Actieve sociale kanalen uit het portaal (Social Media Manager) overschrijven
// de standaardlijst zodra de server ze heeft geladen.
let socialOverride: { id: string; name: string; href: string }[] | null = null;

/** Enkel de aangevinkte kanalen (in de gekozen volgorde) in mails tonen. */
export function applySocialChannels(list: { id: string; name: string; href: string }[]): void {
  socialOverride = list.filter((s) => s.id && /^https?:\/\//i.test(s.href));
}

/** Actuele sociale kanalen voor e-mails (portaal eerst, code als vangnet). */
export function mailSocialChannels(): { id: string; name: string; href: string }[] {
  return socialOverride && socialOverride.length > 0 ? socialOverride : SOCIAL_CHANNELS;
}


/** Eigen logo en/of standaard headerbeeld voor uitgaande mails instellen. */
export function applyMailMedia(m: { logoUrl?: string; headerImageUrl?: string }): void {
  mailMediaOverride = {
    ...(m.logoUrl ? { logoUrl: m.logoUrl } : {}),
    ...(m.headerImageUrl ? { headerImageUrl: m.headerImageUrl } : {}),
  };
}

/** Responsieve <img> voor logo/header: max-breedte 100%, hoogte automatisch. */
function responsiveImg(src: string, alt: string, maxWidth = 220): string {
  return `<img src="${escapeHtml(assetUrl(src))}" alt="${escapeHtml(alt)}" border="0" width="${maxWidth}" style="display:block;outline:none;text-decoration:none;border:none;border:0;max-width:${maxWidth}px;width:100%;height:auto;margin:0 auto;">`;
}

/** Adres, telefoon en e-mail uit het portaal in de e-mails gebruiken. */
export function applySiteContact(c: {
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
}): void {
  const cityLine = [c.postalCode, c.city].filter(Boolean).join(" ");
  orgOverride = {
    ...(c.address ? { address: c.address } : {}),
    ...(cityLine ? { city: cityLine } : {}),
    ...(c.phone ? { phone: c.phone, phoneHref: `tel:${c.phone.replace(/[^\d+]/g, "")}` } : {}),
    ...(c.email ? { email: c.email } : {}),
  };
}

/** Actuele organisatiegegevens (portaal eerst, code als vangnet). */
export const ORG: OrgInfo = new Proxy({} as OrgInfo, {
  get: (_t, key: string) =>
    (orgOverride as Record<string, unknown>)[key] ??
    (ORG_DEFAULTS as unknown as Record<string, unknown>)[key],
  ownKeys: () => Reflect.ownKeys(ORG_DEFAULTS),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});

export const MAIL_COLORS = {
  forest: "#1D3528",
  forestDeep: "#152A1F",
  terra: "#C15C3A",
  terraSoft: "#F0C9B4",
  cream: "#F7F3EB",
  paper: "#FFFFFF",
  line: "#E6DFD3",
  ink: "#26302A",
  muted: "#6F7A72",
  sage: "#9CB29B",
  mist: "#DCE5DA",
} as const;

const C = MAIL_COLORS;

export const SERIF = "Georgia,'Times New Roman',Times,serif";
export const SANS = "Arial,Helvetica,sans-serif";

/** Alle sociale kanalen van de boerderij, in de volgorde van de sitefooter. */
export const SOCIAL_CHANNELS: { id: string; name: string; href: string }[] = [
  { id: "facebook", name: "Facebook", href: "https://facebook.com/maximilienbrussels" },
  { id: "instagram", name: "Instagram", href: "https://instagram.com/maximilienbrussels" },
  { id: "youtube", name: "YouTube", href: "https://youtube.com/@maximilienbrussels" },
  { id: "linkedin", name: "LinkedIn", href: "https://linkedin.com/company/maximilienbrussels" },
  { id: "bluesky", name: "Bluesky", href: "https://bsky.app/profile/maximilien.brussels" },
  { id: "mastodon", name: "Mastodon", href: "https://mastodon.social/@maximilienbrussels" },
  { id: "peertube", name: "PeerTube", href: "https://peertube.be/c/maximilienbrussels" },
  { id: "pinterest", name: "Pinterest", href: "https://pinterest.com/maximilienbrussels" },
  { id: "wsocial", name: "WSocial", href: "https://wsocial.com/maximilienbrussels" },
  { id: "discord", name: "Discord", href: "https://discord.gg/maximilienbrussels" },
];

/** Basis-URL voor links en afbeeldingen; altijd absoluut. */
export function mailOrigin(override?: string): string {
  const raw = (override || PUBLIC_SITE_URL).replace(/\/+$/, "");
  // Publieke mails linken uitsluitend naar het klantendomein; het .site-domein
  // (beheerportaal) en onbekende hosts worden altijd vervangen.
  return isCanonicalHost(raw) ? raw : PUBLIC_SITE_URL;
}

/** Absolute publieke link naar een pagina, in de juiste taal. */
export function publicUrl(page: PageKey, lang: MailLang = "nl", origin?: string): string {
  return `${mailOrigin(origin)}${pathFor(page, lang)}`;
}

/**
 * Vaste, publieke basis-URL voor álle mailafbeeldingen. Mailprogramma's kunnen
 * geen relatieve paden oplossen, dus elk <img> krijgt dit domein ervoor.
 */
export const EMAIL_ASSET_BASE_URL = resolveAssetBase();

function resolveAssetBase(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string | undefined> }).env
        ?.["VITE_EMAIL_ASSET_BASE_URL"]) ||
    (typeof process !== "undefined"
      ? process.env?.["EMAIL_ASSET_BASE_URL"] ??
        process.env?.["VITE_EMAIL_ASSET_BASE_URL"]
      : undefined);
  const base = (fromEnv || PUBLIC_SITE_URL).trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(base) ? base : PUBLIC_SITE_URL;
}

export const MAIL_ASSETS = {
  logo: `${EMAIL_ASSET_BASE_URL}/assets/email/logo-terracotta.png`,
  logoTerracotta: `${EMAIL_ASSET_BASE_URL}/assets/email/logo-terracotta.png`,
  logoWhite: `${EMAIL_ASSET_BASE_URL}/assets/email/logo-white.png`,
  hero: (name: string) => `${EMAIL_ASSET_BASE_URL}/assets/email/${name}`,
  icon: (id: string, tone: "white" | "forest" = "white") =>
    `${EMAIL_ASSET_BASE_URL}/assets/email/icons/${id}${tone === "forest" ? "-forest" : ""}.png`,
};

/** Altijd absolute URL, ook wanneer er nog een relatief pad wordt doorgegeven. */
export function assetUrl(src: string): string {
  if (/^https?:\/\//i.test(src) || src.startsWith("cid:") || src.startsWith("data:")) return src;
  return `${EMAIL_ASSET_BASE_URL}/${src.replace(/^\/+/, "")}`;
}

/**
 * Mailveilig <img>: absolute src, border="0", expliciete afmetingen en
 * display:block — zodat Outlook en Gmail het beeld niet dichtklappen.
 */
export function mailImg(
  src: string,
  alt: string,
  width: number,
  height?: number,
  extraStyle = "",
): string {
  const h = height ? ` height="${height}"` : "";
  const hStyle = height ? `height:${height}px;` : "height:auto;";
  return `<img src="${escapeHtml(assetUrl(src))}" alt="${escapeHtml(alt)}" border="0" width="${width}"${h} style="display:block;outline:none;text-decoration:none;border:none;border:0;width:${width}px;max-width:100%;${hStyle}${extraStyle}">`;
}

/* ------------------------------- Helpers --------------------------------- */

export function escapeHtml(v: string): string {
  return String(v).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Meerregelige gebruikersinvoer veilig in HTML zetten. */
export function paragraphs(text: string): string {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function euro(cents: number): string {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** Terracotta actieknop (bulletproof: tabel + inline styles). */
export function button(href: string, label: string, tone: "terra" | "forest" = "terra"): string {
  const bg = tone === "terra" ? C.terra : C.forest;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
  <tr><td align="center" bgcolor="${bg}" style="border-radius:999px;background:${bg};">
    <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:15px 30px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
  </td></tr></table>`;
}

/** Volledige URL als tekst, voor mailapps die knoppen blokkeren. */
export function linkFallback(href: string, lang: MailLang = "nl"): string {
  return `<p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};word-break:break-all;text-align:center;">${escapeHtml(MAIL_COPY[lang].linkFallback)}<br><a href="${escapeHtml(href)}" style="color:${C.terra};">${escapeHtml(href)}</a></p>`;
}

/** Klein label + waarde in een crème kaartje. */
export function infoCard(label: string, value: string, mono = false): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
  <tr><td bgcolor="${C.cream}" style="background:${C.cream};border:1px solid ${C.line};border-radius:14px;padding:14px 18px;">
    <div style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${escapeHtml(label)}</div>
    <div style="margin-top:6px;font-family:${mono ? "'Courier New',Courier,monospace" : SANS};font-size:${mono ? 16 : 17}px;font-weight:700;line-height:1.4;color:${C.forest};">${escapeHtml(value)}</div>
  </td></tr></table>`;
}

/** Twee kolommen label/waarde (bv. datum · plaats). */
export function infoGrid(cells: { label: string; value: string }[]): string {
  const tds = cells
    .map(
      (c) =>
        `<td width="${Math.floor(100 / cells.length)}%" valign="top" bgcolor="${C.cream}" style="background:${C.cream};border:1px solid ${C.line};border-radius:14px;padding:14px 16px;">
      <div style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${escapeHtml(c.label)}</div>
      <div style="margin-top:6px;font-family:${SANS};font-size:16px;font-weight:700;line-height:1.4;color:${C.forest};">${escapeHtml(c.value)}</div>
    </td>`,
    )
    .join(`<td width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;"><tr>${tds}</tr></table>`;
}

/** Genummerde stappen. */
export function steps(title: string, items: string[]): string {
  const rows = items
    .map(
      (item, i) =>
        `<tr><td valign="top" width="30" style="padding:7px 10px 7px 0;width:30px;"><div style="width:24px;height:24px;border-radius:999px;background:${C.terra};color:#FFFFFF;font-family:${SANS};font-size:12px;font-weight:700;line-height:24px;text-align:center;">${i + 1}</div></td>
         <td style="padding:7px 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.ink};">${item}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
  <tr><td bgcolor="${C.cream}" style="background:${C.cream};border:1px solid ${C.line};border-radius:14px;padding:16px 18px;">
    <div style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${escapeHtml(title)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;">${rows}</table>
  </td></tr></table>`;
}

/** Opsomming met terracotta streepjes. */
export function bulletList(items: string[]): string {
  if (!items.length) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 14px;">${items
    .map(
      (it) =>
        `<tr><td valign="top" width="18" style="padding:4px 0;color:${C.terra};font-family:${SANS};font-size:15px;line-height:1.6;">&#8212;</td><td style="padding:4px 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.ink};">${it}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Tabel met regels en totaal (bestelling, factuur, gift). */
export function lineTable(
  lines: { label: string; value: string; muted?: string }[],
  total?: { label: string; value: string },
): string {
  const rows = lines
    .map(
      (l) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.ink};">${escapeHtml(l.label)}${l.muted ? ` <span style="color:${C.muted};">${escapeHtml(l.muted)}</span>` : ""}</td>
         <td align="right" style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:'Courier New',Courier,monospace;font-size:14px;color:${C.ink};white-space:nowrap;">${escapeHtml(l.value)}</td></tr>`,
    )
    .join("");
  const tot = total
    ? `<tr><td style="padding:14px 0 0;font-family:${SANS};font-size:15px;font-weight:700;color:${C.forest};">${escapeHtml(total.label)}</td>
         <td align="right" style="padding:14px 0 0;font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:700;color:${C.forest};white-space:nowrap;">${escapeHtml(total.value)}</td></tr>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">${rows}${tot}</table>`;
}

/** Sfeerbeeld bovenaan de body (volledige breedte). */
export function heroImage(src: string, alt: string): string {
  return `<img src="${escapeHtml(assetUrl(src))}" alt="${escapeHtml(alt)}" border="0" width="600" style="display:block;outline:none;text-decoration:none;border:none;border:0;width:100%;max-width:600px;height:auto;">`;
}

/** Sectietitel binnen de body (nieuwsbrief). */
export function sectionTitle(kicker: string, title: string): string {
  return `<div style="margin-top:28px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.terra};">${escapeHtml(kicker)}</div>
  <h2 style="margin:6px 0 10px;font-family:${SERIF};font-style:italic;font-weight:normal;font-size:22px;line-height:1.3;color:${C.forest};">${escapeHtml(title)}</h2>`;
}

/** Handtekening van een teamlid. */
export function signature(name: string, role: string, lang: MailLang = "nl"): string {
  const closing = { nl: "Hartelijke groet,", fr: "Bien à vous,", en: "Warm regards," }[lang];
  return `<p style="margin:22px 0 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.ink};">${escapeHtml(closing)}<br>
  <strong style="color:${C.forest};">${escapeHtml(name)}</strong><br>
  <span style="color:${C.muted};font-size:13px;">${escapeHtml(role)} · ${BRAND_NAME}</span></p>`;
}

/* --------------------------------- Footer -------------------------------- */

const FOOTER_COPY: Record<
  MailLang,
  {
    links: { label: string; key: PageKey }[];
    follow: string;
    support: string;
    privacy: string;
    unsubscribe: string;
    legal: string;
  }
> = {
  nl: {
    links: [
      { label: "Bezoek", key: "visit" },
      { label: "Hoevewinkel", key: "shop" },
      { label: "Academy", key: "academy" },
      { label: "Verhuur", key: "rental" },
      { label: "Steun ons", key: "support" },
      { label: "Contact", key: "contact" },
    ],
    follow: "Volg de boerderij",
    support: "Met de steun van Stad Brussel & Brusselse Stadslandbouw",
    privacy: "Privacy",
    unsubscribe: "Uitschrijven",
    legal: "Ondernemingsnummer",
  },
  fr: {
    links: [
      { label: "Visite", key: "visit" },
      { label: "Boutique", key: "shop" },
      { label: "Academy", key: "academy" },
      { label: "Location", key: "rental" },
      { label: "Soutenir", key: "support" },
      { label: "Contact", key: "contact" },
    ],
    follow: "Suivez la ferme",
    support: "Avec le soutien de la Ville de Bruxelles & Agriculture urbaine bruxelloise",
    privacy: "Vie privée",
    unsubscribe: "Se désinscrire",
    legal: "Numéro d'entreprise",
  },
  en: {
    links: [
      { label: "Visit", key: "visit" },
      { label: "Farm shop", key: "shop" },
      { label: "Academy", key: "academy" },
      { label: "Rental", key: "rental" },
      { label: "Support us", key: "support" },
      { label: "Contact", key: "contact" },
    ],
    follow: "Follow the farm",
    support: "With the support of the City of Brussels & Brussels Urban Agriculture",
    privacy: "Privacy",
    unsubscribe: "Unsubscribe",
    legal: "Company number",
  },
};

function socialRow(origin: string): string {
  const channels = mailSocialChannels();
  if (channels.length === 0) return "";
  const cells = channels
    .map(
      (s) =>
        `<td align="center" width="40" style="padding:0 8px;"><a href="${escapeHtml(s.href)}" target="_blank" title="${escapeHtml(s.name)}" style="display:inline-block;width:36px;height:36px;border-radius:999px;background:${C.forestDeep};text-align:center;">
        <img src="${MAIL_ASSETS.icon(s.id)}" border="0" width="24" height="24" alt="${escapeHtml(s.name)}" style="display:inline-block;outline:none;text-decoration:none;border:none;border:0;width:24px;height:24px;margin-top:6px;">
      </a></td>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:10px auto 0;"><tr>${cells}</tr></table>`;
}


export function footer(lang: MailLang, opts: { origin: string; unsubscribeUrl?: string }): string {
  const f = FOOTER_COPY[lang];
  const o = opts.origin;
  const links = f.links
    .map(
      (l) =>
        `<a href="${o}${pathFor(l.key, lang)}" style="display:inline-block;padding:4px 9px;font-family:${SANS};font-size:12px;color:${C.terraSoft};text-decoration:none;">${escapeHtml(l.label)}</a>`,
    )
    .join(`<span style="color:${C.sage};">&#183;</span>`);

  return `<tr><td bgcolor="${C.forest}" align="center" style="background:${C.forest};padding:30px 24px 26px;">
  <a href="${o}" style="text-decoration:none;">
    <img src="${MAIL_ASSETS.logoWhite}" border="0" width="56" height="40" alt="${BRAND_NAME}" style="display:block;outline:none;text-decoration:none;border:none;border:0;margin:0 auto;width:56px;height:40px;">
  </a>
  <div style="margin-top:10px;font-family:${SERIF};font-style:italic;font-size:18px;line-height:1.3;color:#FFFFFF;">${BRAND_NAME}</div>
  <div style="margin-top:4px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.sage};">${escapeHtml(BRAND_TAGLINE[lang])}</div>

  <div style="margin-top:16px;font-family:${SANS};font-size:13px;line-height:1.7;color:${C.mist};">
    ${escapeHtml(ORG.address)}, ${escapeHtml(ORG.city)}<br>
    <a href="${ORG.phoneHref}" style="color:${C.terraSoft};text-decoration:none;">${escapeHtml(ORG.phone)}</a>
    &nbsp;&#183;&nbsp;
    <a href="mailto:${ORG.email}" style="color:${C.terraSoft};text-decoration:none;">${ORG.email}</a>
  </div>

  <div style="margin-top:14px;">${links}</div>

  <div style="margin-top:18px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.sage};">${escapeHtml(f.follow)}</div>
  ${socialRow(o)}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
    <tr><td style="border-top:1px solid rgba(255,255,255,0.16);padding-top:16px;font-family:${SANS};font-size:11px;line-height:1.7;color:${C.sage};text-align:center;">
      ${escapeHtml(f.support)}<br>
      ${escapeHtml(ORG.legalName)} &#183; ${escapeHtml(f.legal)} ${escapeHtml(ORG.vat)}<br>
      <a href="${o}${pathFor("privacy", lang)}" style="color:${C.mist};text-decoration:underline;">${escapeHtml(f.privacy)}</a>
      ${opts.unsubscribeUrl ? `&nbsp;&#183;&nbsp;<a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${C.mist};text-decoration:underline;">${escapeHtml(f.unsubscribe)}</a>` : ""}
    </td></tr>
  </table>
</td></tr>`;
}

/* --------------------------------- Shell --------------------------------- */

export interface ShellOptions {
  /** Verborgen voorbeeldtekst in de inbox. */
  preview: string;
  title: string;
  kicker?: string;
  /** Reeds veilige HTML (tekst uit invoer eerst door escapeHtml/paragraphs). */
  body: string;
  lang?: MailLang;
  /** Sfeerbeeld tussen kop en titel (absolute URL). */
  hero?: { src: string; alt: string };
  /** Overschrijft SITE_URL (bv. proces-omgeving op de server). */
  origin?: string;
  /** Voor nieuwsbrieven: toont een uitschrijflink in de voettekst. */
  unsubscribeUrl?: string;
  /** Verberg de disclaimer onder de kaart (teamsjablonen). */
  hideDisclaimer?: boolean;
}

export function shell(opts: ShellOptions): string {
  const lang: MailLang = opts.lang ?? "nl";
  const origin = mailOrigin(opts.origin);
  const t = MAIL_COPY[lang];
  const domain = origin.replace(/^https?:\/\//, "");

  return `<!doctype html>
<html lang="${t.htmlLang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(opts.title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
  a{color:${C.terra};}
  @media only screen and (max-width:620px){
    .wrap{width:100%!important;}
    .pad{padding-left:20px!important;padding-right:20px!important;}
    .h1{font-size:24px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.cream};" bgcolor="${C.cream}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.cream};">${escapeHtml(opts.preview)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background:${C.cream};">
<tr><td align="center" style="padding:28px 12px 36px;">

  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${C.paper};border:1px solid ${C.line};border-radius:20px;overflow:hidden;">

    <!-- Kop: logo op crème -->
    <tr><td class="pad" align="center" bgcolor="${C.cream}" style="background:${C.cream};border-bottom:1px solid ${C.line};padding:28px 24px 22px;">
      <a href="${origin}" style="text-decoration:none;">
        ${
          mailMediaOverride.logoUrl
            ? responsiveImg(mailMediaOverride.logoUrl, BRAND_NAME, 98)
            : `<img src="${MAIL_ASSETS.logoTerracotta}" border="0" width="98" height="70" alt="${BRAND_NAME}" style="display:block;outline:none;text-decoration:none;border:none;border:0;margin:0 auto;width:98px;height:70px;">`
        }
      </a>
      <div style="margin-top:12px;font-family:${SERIF};font-style:italic;font-size:22px;line-height:1.25;color:${C.forest};">${BRAND_NAME}</div>
      <div style="margin-top:6px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.muted};">${escapeHtml(BRAND_TAGLINE[lang])}</div>
    </td></tr>

    ${
      opts.hero
        ? `<tr><td style="padding:0;line-height:0;font-size:0;">${heroImage(opts.hero.src, opts.hero.alt)}</td></tr>`
        : mailMediaOverride.headerImageUrl
          ? `<tr><td style="padding:0;line-height:0;font-size:0;">${heroImage(mailMediaOverride.headerImageUrl, BRAND_NAME)}</td></tr>`
          : ""
    }

    <!-- Titel -->
    <tr><td class="pad" style="padding:30px 32px 0;">
      ${opts.kicker ? `<div style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.terra};">${escapeHtml(opts.kicker)}</div>` : ""}
      <h1 class="h1" style="margin:${opts.kicker ? 10 : 0}px 0 0;font-family:${SERIF};font-style:italic;font-weight:normal;font-size:28px;line-height:1.25;color:${C.forest};">${escapeHtml(opts.title)}</h1>
      <div style="margin-top:14px;width:44px;height:3px;background:${C.terra};border-radius:3px;font-size:0;line-height:0;">&nbsp;</div>
    </td></tr>

    <!-- Inhoud -->
    <tr><td class="pad" style="padding:18px 32px 34px;font-family:${SANS};font-size:16px;line-height:1.65;color:${C.ink};word-break:break-word;">${opts.body}</td></tr>

    ${footer(lang, { origin, ...(opts.unsubscribeUrl ? { unsubscribeUrl: opts.unsubscribeUrl } : {}) })}

  </table>
  <!--[if mso]></td></tr></table><![endif]-->

  ${
    opts.hideDisclaimer
      ? ""
      : `<div style="max-width:600px;margin:14px auto 0;font-family:${SANS};font-size:11px;line-height:1.6;color:${C.muted};text-align:center;">${escapeHtml(t.disclaimer(domain))}</div>`
  }

</td></tr></table>
</body></html>`;
}
