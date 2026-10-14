/**
 * Centrale Brevo-payload voor élke uitgaande mail (uitnodigingen, wachtwoord-
 * resets, boekingsbevestigingen …).
 *
 * Afzender en reply-to komen uit de environment, met vaste huisstijl-fallbacks:
 *   BREVO_SENDER_NAME  → "Maximilien"
 *   BREVO_SENDER_EMAIL → "no-reply@send.maximilien.site"
 *   BREVO_REPLY_TO     → "hallo@maximilien.brussels"
 *
 * Server-only waarden worden via `process.env` gelezen (secrets horen niet in
 * de browserbundel); in de browser valt de helper terug op de defaults.
 */

export const BREVO_DEFAULT_SENDER_NAME = "Maximilien";
export const BREVO_DEFAULT_SENDER_EMAIL = "no-reply@send.maximilien.site";
export const BREVO_DEFAULT_REPLY_TO = "hallo@maximilien.brussels";

/**
 * Leest een variabele robuust uit élke omgeving: Node/Worker (`process.env`,
 * o.a. Vercel serverless) én de Vite-bundel (`import.meta.env`). Ontbreekt de
 * waarde overal, dan geeft de helper `undefined` terug en wordt de vaste
 * huisstijl-fallback gebruikt.
 */
export function brevoEnv(name: string): string | undefined {
  let value: unknown;
  try {
    value = typeof process !== "undefined" ? process.env?.[name] : undefined;
  } catch {
    value = undefined;
  }
  if (typeof value !== "string" || !value.trim()) {
    try {
      const meta = (import.meta as unknown as { env?: Record<string, unknown> }).env;
      value = meta?.[name] ?? meta?.[`VITE_${name}`];
    } catch {
      value = undefined;
    }
  }
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const env = brevoEnv;


export type BrevoSender = { name: string; email: string };

export function brevoSender(override?: Partial<BrevoSender>): BrevoSender {
  return {
    name: override?.name || env("BREVO_SENDER_NAME") || BREVO_DEFAULT_SENDER_NAME,
    email: override?.email || env("BREVO_SENDER_EMAIL") || BREVO_DEFAULT_SENDER_EMAIL,
  };
}

export function brevoReplyTo(override?: string): { email: string } {
  return { email: override?.trim() || env("BREVO_REPLY_TO") || BREVO_DEFAULT_REPLY_TO };
}

export type BrevoEmailPayload = {
  sender: BrevoSender;
  replyTo: { email: string };
  to: { email: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  headers?: Record<string, string>;
  trackingSettings?: { clickTracking: boolean; openTracking: boolean };
};

/**
 * Strikte transactionele instellingen voor systeembrieven (inloglinks,
 * wachtwoordresets …): klik- en opentracking uit zodat Brevo de actielink
 * NIET herschrijft naar een trackingdomein, plus MIME-headers die de mail
 * als automatisch systeembericht markeren (geen nieuwsbrief/lijst).
 */
export const TRANSACTIONAL_HEADERS: Record<string, string> = {
  "Auto-Submitted": "auto-generated",
  "X-Auto-Response-Suppress": "All, OOF, AutoReply",
  "X-Brevo-Tag": "transactional-auth",
  "X-Entity-Ref-ID": "magic-link-auth",
};

export const TRANSACTIONAL_TRACKING = {
  clickTracking: false,
  openTracking: false,
} as const;

/** Bouwt de exacte Brevo REST-payload met vaste afzender- en reply-to-headers. */
export function buildBrevoPayload(opts: {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
  senderName?: string;
  senderEmail?: string;
  /** Voegt transactionele headers + uitgeschakelde tracking toe. */
  transactional?: boolean;
}): BrevoEmailPayload {
  const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to])
    .map((address) => address.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  return {
    sender: brevoSender({ name: opts.senderName, email: opts.senderEmail }),
    replyTo: brevoReplyTo(opts.replyTo),
    to: recipients,
    subject: opts.subject,
    htmlContent: opts.htmlContent,
    ...(opts.textContent ? { textContent: opts.textContent } : {}),
    ...(opts.transactional
      ? { headers: TRANSACTIONAL_HEADERS, trackingSettings: TRANSACTIONAL_TRACKING }
      : {}),
  };
}

/**
 * Bepaalt hoe de Brevo-API bereikt wordt. Een Lovable-connectorsleutel
 * (`lovc_…`) loopt via de connector-gateway; een klassieke Brevo-sleutel
 * (`xkeysib-…`) gaat altijd rechtstreeks naar api.brevo.com — ook wanneer er
 * toevallig een LOVABLE_API_KEY bestaat, want de gateway weigert die sleutel.
 */
export function brevoRoute(apiKey: string, lovableKey?: string) {
  const gateway = Boolean(lovableKey) && apiKey.startsWith("lovc_");
  return {
    gateway,
    label: gateway ? ("Lovable connector-gateway" as const) : ("Brevo API rechtstreeks" as const),
    url: (path: string) =>
      gateway
        ? `https://connector-gateway.lovable.dev/brevo/${path.replace(/^\/+/, "")}`
        : `https://api.brevo.com/v3/${path.replace(/^\/+/, "")}`,
    headers: (gateway
      ? {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": apiKey,
          "content-type": "application/json",
          accept: "application/json",
        }
      : {
          "api-key": apiKey,
          "content-type": "application/json",
          accept: "application/json",
        }) as Record<string, string>,
  };
}
