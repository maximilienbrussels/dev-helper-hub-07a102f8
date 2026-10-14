/**
 * Server-only helpers voor auth-mails. Bewust in een *.server.ts-module zodat
 * ze niet verdwijnen bij het splitsen van de serverfunctie-bestanden.
 *
 * Wij maken de actielink zelf aan (zie auth-token.server.ts) en versturen de
 * mail via onze eigen mailer in de huisstijl en de taal van de gebruiker.
 * Lukt het aanmaken niet (bv. geen databaseconnectie), dan valt de code terug
 * op de standaardmail van de auth-provider — de gebruiker blijft dan altijd
 * een werkende link krijgen.
 */
import type { MailLang } from "./email-copy";
import { AUTH_MAIL_COPY, type AuthMailKind } from "./auth-mail-copy";

/**
 * Bepaalt de basis-URL van de lopende aanvraag, zodat herstel- en
 * bevestigingslinks in preview én productie naar de juiste site wijzen.
 */
export async function requestOrigin(): Promise<string> {
  const { getRequestHeaders } = await import("@tanstack/react-start/server");
  const { siteOrigin } = await import("./email.server");
  const headers = new Headers(getRequestHeaders() as unknown as Record<string, string>);
  const configuredMode = process.env["VITE_APP_MODE"];
  const configuredOrigin =
    configuredMode === "field"
      ? "https://maximilien.app"
      : configuredMode === "admin"
        ? "https://maximilien.site"
        : undefined;
  const trustedOrigin = (raw: string | null): string | null => {
    if (!raw) return null;
    try {
      const candidate = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const hostname = candidate.hostname.toLowerCase();
      const trusted =
        hostname === "maximilien.site" ||
        hostname.endsWith(".maximilien.site") ||
        hostname === "maximilien.app" ||
        hostname.endsWith(".maximilien.app") ||
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".lovable.app") ||
        hostname.endsWith(".vercel.app") ||
        hostname === "maximilien.dlp.li";
      return trusted ? candidate.origin.replace(/\/+$/, "") : null;
    } catch {
      return null;
    }
  };
  // Achter een proxy (Vercel) staat het publieke adres in x-forwarded-host.
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    const forwardedOrigin = trustedOrigin(`${proto}://${forwardedHost}`);
    if (forwardedOrigin) return forwardedOrigin;
  }
  const origin = trustedOrigin(headers.get("origin"));
  if (origin) return origin;
  const host = trustedOrigin(headers.get("host"));
  if (host) return host;
  return configuredOrigin ?? siteOrigin();
}

/**
 * Startpad voor een medewerker, afgeleid uit het adres waar de aanvraag vandaan
 * komt: een aanvraag vanuit de veld-app (maximilien.app) landt op /veld, een
 * aanvraag vanuit het desktopbeheer op /nl/vandaag.
 */
export async function teamLandingPath(): Promise<string> {
  const origin = await requestOrigin();
  const { isFieldHostname } = await import("./app-mode");
  try {
    return isFieldHostname(new URL(origin).hostname) ? "/veld" : "/nl/vandaag";
  } catch {
    return "/nl/vandaag";
  }
}

/** Sjablonen met een actielink; "recovery" blijft als alias bestaan. */
export type AuthLinkKind = "invite" | "teamReset" | "teamMagic" | "verify" | "magic" | "reset";

const RESET_FAMILY: AuthLinkKind[] = ["invite", "teamReset", "reset"];

const TTL: Record<AuthLinkKind, number> = {
  invite: 7 * 24 * 3600,
  teamReset: 3600,
  reset: 3600,
  teamMagic: 3600,
  magic: 3600,
  verify: 24 * 3600,
};

/**
 * Platte-tekstversie van een auth-mail. Dual-MIME (tekst + HTML) voorkomt dat
 * spamfilters de mail als promotioneel bestempelen; bevat altijd de kale
 * actielink én — bij inlogmails — de 6-cijferige code.
 */
function authPlainText(
  kind: AuthMailKind,
  url: string,
  lang: MailLang,
  code?: string,
): string {
  const copy = AUTH_MAIL_COPY[lang][kind];
  const AUTO_LINE: Record<MailLang, string> = {
    nl: "Dit is een automatisch gegenereerde inlogaanvraag van Maximilien. Je hoeft hier niet op te antwoorden.",
    fr: "Ceci est une demande de connexion générée automatiquement par Maximilien. Il n'est pas nécessaire d'y répondre.",
    en: "This is an automated sign-in request from Maximilien. No reply is needed.",
  };
  const CODE_LINE: Record<MailLang, string> = {
    nl: `Je 6-cijferige inlogcode: ${code}`,
    fr: `Votre code de connexion à 6 chiffres : ${code}`,
    en: `Your 6-digit sign-in code: ${code}`,
  };
  return [
    copy.title,
    "",
    copy.intro,
    "",
    ...(copy.cta ? [`${copy.cta}: ${url}`] : []),
    ...(code ? ["", CODE_LINE[lang]] : []),
    "",
    copy.small,
    "",
    AUTO_LINE[lang],
  ].join("\n");
}

/** Verstuurt de mail met onze eigen opmaak. */
async function deliver(
  kind: AuthMailKind,
  email: string,
  naam: string | undefined,
  url: string,
  lang: MailLang,
  code?: string,
) {
  const { authActionEmail, sendMail } = await import("./email.server");
  const { subject, html } = authActionEmail(kind, { naam, url, lang, code });
  console.info(`[auth-mail] kind=${kind} status=dispatching callback=${new URL(url).origin}`);
  return sendMail({
    to: email,
    subject,
    html,
    text: authPlainText(kind, url, lang, code),
    transactional: true,
    kind: `auth-${kind}`,
    transport: "brevo",
  });
}

/** Nette Nederlandse boodschap per faalreden — nooit ruwe API-JSON. */
const DELIVERY_MESSAGES: Record<string, string> = {
  mail_unauthorized:
    "We kunnen momenteel geen e-mail versturen: de mailkoppeling wordt hersteld. Probeer het over enkele minuten opnieuw.",
  mail_rate_limited:
    "Er zijn net te veel mails verstuurd. Probeer het over enkele minuten opnieuw.",
  mail_provider_error:
    "Onze mailprovider is tijdelijk onbereikbaar. Probeer het straks opnieuw.",
  missing_smtp_config:
    "De mailverzending is nog niet ingesteld. Neem contact met ons op.",
  missing_from_address:
    "De mailverzending is nog niet volledig ingesteld. Neem contact met ons op.",
  missing_recipient: "Vul een geldig e-mailadres in.",
};

function requireDelivered(
  result: { sent: boolean; error?: string; reason?: string },
  kind: AuthLinkKind,
): void {
  if (result.sent) return;
  console.error(
    `[auth-mail] kind=${kind} status=failed code=${result.reason ?? "unknown"} detail=${result.error ?? "geen detail"}`,
  );
  const friendly = result.reason ? DELIVERY_MESSAGES[result.reason] : undefined;
  throw new Error(
    friendly ??
      `De ${kind === "verify" ? "bevestigingsmail" : "inlogmail"} kon niet worden verzonden. Probeer het straks opnieuw.`,
  );
}

/**
 * Bouwt de absolute inloglink. De link wijst altijd naar onze eigen
 * /inloglink-pagina: die wisselt de eenmalige token in voor een sessie.
 */
export async function magicVerifyUrl(token: string, callbackUrl: string): Promise<string> {
  const origin = await requestOrigin();
  let next = callbackUrl;
  try {
    if (/^https?:\/\//i.test(callbackUrl)) {
      const url = new URL(callbackUrl);
      next = `${url.pathname}${url.search}` || "/account";
    }
  } catch {
    next = "/account";
  }
  return `${origin}/inloglink?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
}

/**
 * Genereert de actielink en verstuurt hem in de huisstijl van de boerderij.
 * Onbekende adressen worden bewust stil afgehandeld, zodat niemand kan
 * aftoetsen welke e-mailadressen bestaan.
 */
export async function sendAuthLink(
  type: AuthLinkKind | "recovery",
  email: string,
  naam: string | undefined,
  next: string,
  lang: MailLang = "nl",
) {
  const kind: AuthLinkKind = type === "recovery" ? "reset" : type;
  const origin = await requestOrigin();
  const target = next.startsWith("/") ? next : `/${next}`;
  const auth = await import("./local-auth.server");

  if (RESET_FAMILY.includes(kind)) {
    const bestaande = await auth.findUserByEmail(email);
    // Onbekend adres: stil hetzelfde antwoord, geen mail (geen enumeratie).
    if (!bestaande && kind === "reset") return { ok: true as const };
    const token = await auth.mintToken({
      kind: "reset",
      email,
      ttlSeconds: TTL[kind],
      userId: bestaande?.id ?? null,
    });
    if (!token) throw new Error("Aanmelden is tijdelijk niet beschikbaar. Probeer het straks opnieuw.");
    const url = `${origin}/wachtwoord-herstellen?token=${encodeURIComponent(token)}`;
    requireDelivered(await deliver(kind, email, naam, url, lang), kind);
    return { ok: true as const };
  }

  const token = await auth.mintToken({
    kind: kind === "verify" ? "verify" : "magic",
    email,
    ttlSeconds: TTL[kind],
    redirectTo: target,
  });
  if (!token) throw new Error("Aanmelden is tijdelijk niet beschikbaar. Probeer het straks opnieuw.");
  const url = await magicVerifyUrl(token, `${origin}${target}`);
  // Bij een inloglink ook een 6-cijferige code meesturen als alternatief.
  const code =
    kind === "magic" || kind === "teamMagic"
      ? ((await auth.mintLoginCode(email, TTL[kind])) ?? undefined)
      : undefined;
  requireDelivered(await deliver(kind, email, naam, url, lang, code), kind);
  return { ok: true as const };
}


/** Beveiligingsmelding zonder actielink (sjabloon 8). */
export async function sendSecurityNotice(
  kind: AuthMailKind,
  email: string,
  naam: string | undefined,
  lang: MailLang = "nl",
) {
  const origin = await requestOrigin();
  await deliver(kind, email, naam, `${origin}/account`, lang);
  return { ok: true as const };
}

/**
 * True in lokale ontwikkeling en op previewdomeinen. Alleen daar tonen we de
 * inlogcode op het scherm; op maximilien.site gebeurt dat nooit.
 */
export async function isPreviewEnvironment(): Promise<boolean> {
  const origin = (await requestOrigin()).toLowerCase();
  if (/maximilien\.site/.test(origin)) return false;
  if (process.env["NODE_ENV"] !== "production") return true;
  return /localhost|127\.0\.0\.1|\.lovable\.app/.test(origin);
}

export type TeamLoginCodeResult = {
  delivered: boolean;
  reason?: string;
  error?: string;
  code?: string;
  url?: string;
};

/**
 * Maakt de inloglink + 6-cijferige code voor een teamadres aan en probeert die
 * te mailen. Het resultaat vertelt of de mail écht vertrok, zodat de UI bij een
 * ontbrekende Brevo-sleutel de code meteen op het scherm kan tonen (preview).
 */
export async function sendTeamLoginCode(
  email: string,
  naam: string | undefined,
  lang: MailLang = "nl",
  next = "/account",
): Promise<TeamLoginCodeResult> {
  const origin = await requestOrigin();
  const auth = await import("./local-auth.server");

  const token = await auth.mintToken({
    kind: "magic",
    email,
    ttlSeconds: TTL.teamMagic,
    redirectTo: next,
  });
  if (!token) return { delivered: false, reason: "no_database" };

  const url = await magicVerifyUrl(token, `${origin}${next}`);
  const code = (await auth.mintLoginCode(email, TTL.teamMagic)) ?? undefined;


  try {
    const res = await deliver("teamMagic", email, naam, url, lang, code);
    if (!res.sent) {
      console.error(
        `[auth-mail] kind=teamMagic status=failed code=${res.reason ?? "unknown"} detail=${res.error ?? "geen detail"}`,
      );
    }
    return { delivered: res.sent, reason: res.reason, error: res.error, code, url };
  } catch (error) {
    console.error(
      `[auth-mail] kind=teamMagic status=exception detail=${error instanceof Error ? error.message : "onbekend"}`,
    );
    return {
      delivered: false,
      reason: "send_failed",
      error: error instanceof Error ? error.message : "onbekend",
      code,
      url,
    };
  }
}
