/**
 * SMTP-verzending + huisstijl-mailsjablonen, server-only.
 * GDPR zero-tracking: geen open/click-pixels, geen persoonlijke data in logs.
 * Instellingen komen uit de tabel `smtp_config` of uit de environment variables
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (zie smtp.server.ts).
 */
// worker-mailer wordt pas binnen sendMail geladen: het pakket vereist
// `cloudflare:sockets`, dat enkel in de Worker-runtime bestaat (niet in dev).
import { MAIL_COPY, type MailLang } from "./email-copy";
import { brevoEnv, buildBrevoPayload, brevoRoute } from "./brevo";
import { AUTH_MAIL_COPY, type AuthMailKind } from "./auth-mail-copy";
import {
  classifySmtpError,
  logEmailEvent,
  resolveSmtpConfig,
  type SmtpConfig,
} from "./smtp.server";

/** Zichtbare afzendernaam voor élke uitgaande mail. */
export const FROM_NAME = "Maximilien";

/* --------------------------- Tijdschild (timeouts) ------------------------ */
/** Brevo REST-oproep: max. 8 s. */
const BREVO_TIMEOUT_MS = 8000;
/** SMTP-verbinding opzetten (incl. begroeting): max. 5 s. */
const SMTP_CONNECT_TIMEOUT_MS = 5000;
/** SMTP-bericht doorsturen: max. 8 s. */
const SMTP_SEND_TIMEOUT_MS = 8000;

/** Voert `task` uit met een harde tijdslimiet; werpt een leesbare fout. */
async function withTimeout<T>(task: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout: ${label} na ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}


function fromHeader(cfg: SmtpConfig): string {
  return `${cfg.fromName || FROM_NAME} <${cfg.fromAddress}>`;
}

export type SendResult = {
  sent: boolean;
  reason?: string;
  error?: string;
  /** Diagnostiek: Brevo-message-id, gebruikte route en duur in ms. */
  messageId?: string;
  transport?: string;
  durationMs?: number;
};

/**
 * Verzendt via Brevo zodra `BREVO_API_KEY` bestaat.
 *
 * De sleutel is de Lovable-connectorsleutel: de oproep loopt via de Lovable
 * connector-gateway (`LOVABLE_API_KEY` + `X-Connection-Api-Key`). Bestaat er
 * geen `LOVABLE_API_KEY`, dan wordt de Brevo-API rechtstreeks aangesproken met
 * een klassieke Brevo-sleutel. Zonder Brevo valt de code terug op SMTP.
 */
async function sendViaBrevo(
  apiKey: string,
  cfg: SmtpConfig,
  opts: {
    to: string[];
    subject: string;
    html: string;
    replyTo?: string;
    text?: string;
    transactional?: boolean;
  },
): Promise<{ messageId?: string; route: string }> {
  const route = brevoRoute(apiKey, process.env["LOVABLE_API_KEY"]);
  const url = route.url("smtp/email");
  const headers = route.headers;

  // Afzender komt ALTIJD uit de omgeving: eerst BREVO_SENDER_EMAIL /
  // BREVO_SENDER_NAME, anders de vaste huisstijl-terugval no-reply@send.maximilien.site
  // (zie brevo.ts). SMTP-instellingen mogen het Brevo-afzenderadres nooit overschrijven.
  const senderEmail = brevoEnv("BREVO_SENDER_EMAIL") ?? "";
  const senderName = brevoEnv("BREVO_SENDER_NAME") ?? "";
  const payload = buildBrevoPayload({
    to: opts.to,
    subject: opts.subject,
    htmlContent: opts.html,
    ...(opts.text ? { textContent: opts.text } : {}),
    ...(opts.transactional ? { transactional: true } : {}),
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    ...(senderName ? { senderName } : {}),
    ...(senderEmail ? { senderEmail } : {}),
  });
  if (payload.headers) {
    payload.headers["X-Entity-Ref-ID"] = crypto.randomUUID();
  }

  // Verificatie in het serverlogboek: exacte afzender die naar Brevo gaat.
  console.info(
    `[email] brevo-afzender: ${payload.sender.name} <${payload.sender.email}> via ${route.label}`,
  );

  const res = await fetch(url, {
    method: "POST",
    // Tijdschild: de API-oproep mag de serverfunctie nooit laten vastlopen.
    signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    headers,

    body: JSON.stringify(payload),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(
      `[email] brevo-response status=${res.status} route=${route.label} sender=${payload.sender.email} body=${text.slice(0, 300)}`,
    );
    throw new Error(`Brevo ${res.status} via ${route.label}: ${text.slice(0, 300)}`);
  }
  let messageId: string | undefined;
  try {
    messageId = (JSON.parse(text) as { messageId?: string }).messageId;
  } catch {
    messageId = undefined;
  }
  return { ...(messageId ? { messageId } : {}), route: route.label };
}



/**
 * Laadt adres, telefoon en e-mail uit het portaal in de e-mailhuisstijl.
 * Wordt bij het opstarten en voor elke verzending ververst; bij een fout
 * blijven de vaste gegevens uit de code staan.
 */
let brandingLoaded: Promise<void> | null = null;
export function refreshMailBranding(): Promise<void> {
  brandingLoaded ??= (async () => {
    try {
      const [
        { loadSiteConfig },
        { applySiteContact, applyMailMedia, applySocialChannels },
        { db },
        { activeSocialLinks },
      ] = await Promise.all([
        import("@/lib/site-config.server"),
        import("@/lib/email-shell"),
        import("@/lib/neon.server"),
        import("@/lib/site-config"),
      ]);
      const cfg = await loadSiteConfig();
      if (cfg.contact) applySiteContact(cfg.contact);
      // Enkel de aangevinkte kanalen uit de Social Media Manager in de voettekst.
      applySocialChannels(
        activeSocialLinks(cfg).map((s) => ({ id: s.id, name: s.name, href: s.url })),
      );


      const sql = db();
      const rows = (await sql`
        select value from site_settings where key = 'mail_media' limit 1
      `) as Array<{ value: { logoUrl?: string; headerImageUrl?: string } }>;
      const media = rows[0]?.value;
      if (media?.logoUrl || media?.headerImageUrl) applyMailMedia(media);
    } catch (err) {
      console.error("[mail] contactgegevens niet geladen", err);
    }
  })();
  return brandingLoaded;
}
void refreshMailBranding();

export async function sendMail(opts: {
  /** Eén adres of meerdere adressen van de organisatie. */
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  /** Volledige platte-tekstversie (dual-MIME; betere aflevering bij filters). */
  text?: string;
  /** Systeemmail (inloglink, reset …): zet tracking uit + strikte headers. */
  transactional?: boolean;
  /** Soort mail, gebruikt in het logboek (bv. "order", "magic-link"). */
  kind?: string;
  /**
   * Forceert één kanaal: "brevo" (REST API v3) of "smtp" (Infomaniak).
   * Zonder waarde kiest de mailer zelf: Brevo zodra er een sleutel is, anders SMTP.
   */
  transport?: "brevo" | "smtp";
}): Promise<SendResult> {
  await refreshMailBranding();
  const kind = opts.kind ?? "overig";
  const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to])
    .map((a) => a.trim())
    .filter(Boolean);
  const logRecipient = recipients[0] ?? "";
  const cfg = await resolveSmtpConfig();
  const brevoKey = (await import("./brevo-override.server")).brevoApiKey();
  const useBrevo = opts.transport === "smtp" ? false : Boolean(brevoKey);

  if (!recipients.length) {
    const message = "Er is geen ontvanger ingesteld voor deze mail.";
    console.warn(`[email] ${message}`);
    return { sent: false, reason: "missing_recipient", error: message };
  }

  if (opts.transport === "brevo" && !brevoKey) {
    const message = "Brevo is niet ingesteld (BREVO_API_KEY ontbreekt).";
    console.warn(`[email] ${message}`);
    return { sent: false, reason: "missing_brevo_key", error: message };
  }

  if (!useBrevo && (!cfg.host || !cfg.username || !cfg.password)) {
    const message =
      "De mailverzending is nog niet ingesteld (Brevo-API-key of SMTP-gegevens ontbreken).";
    console.warn(`[email] ${message}`);
    await logEmailEvent({
      kind,
      recipient: logRecipient,
      subject: opts.subject,
      status: "skipped",
      errorCode: "missing_smtp_config",
      errorMessage: message,
      smtpHost: cfg.host || null,
    });
    return { sent: false, reason: "missing_smtp_config", error: message };
  }
  if (useBrevo && !cfg.fromAddress) {
    const message = "Er is nog geen afzenderadres ingesteld voor uitgaande mail.";
    console.warn(`[email] ${message}`);
    await logEmailEvent({
      kind,
      recipient: logRecipient,
      subject: opts.subject,
      status: "skipped",
      errorCode: "missing_from_address",
      errorMessage: message,
      smtpHost: null,
    });
    return { sent: false, reason: "missing_from_address", error: message };
  }

  const startedAt = Date.now();
  let transport = useBrevo ? "brevo-api" : `${cfg.host}:${cfg.port}`;
  let messageId: string | undefined;
  try {
    if (useBrevo && brevoKey) {

      const out = await sendViaBrevo(brevoKey, cfg, { ...opts, to: recipients });
      transport = out.route;
      messageId = out.messageId;
    } else {
      const { WorkerMailer } = await import("worker-mailer");
      const mailer = await withTimeout(
        WorkerMailer.connect({
          host: cfg.host,
          port: cfg.port,
          secure: cfg.secure,
          startTls: !cfg.secure,
          credentials: { username: cfg.username, password: cfg.password },
          authType: ["plain", "login"],
        }),
        SMTP_CONNECT_TIMEOUT_MS,
        "SMTP-verbinding",
      );

      try {
        await withTimeout(
          mailer.send({
            from: fromHeader(cfg),
            to: recipients,
            reply: opts.replyTo,
            subject: opts.subject,
            html: opts.html,
            ...(opts.text ? { text: opts.text } : {}),
          }),
          SMTP_SEND_TIMEOUT_MS,
          "SMTP-verzending",
        );
      } finally {
        // Sluiten mag nooit de verzending doen mislukken.
        await Promise.resolve(mailer.close()).catch(() => undefined);
      }
    }

    const durationMs = Date.now() - startedAt;
    // Diagnostiek zonder persoonsgegevens (GDPR: geen ontvanger in de console).
    console.info(
      `[email] kind=${kind} route=${transport} status=sent duur=${durationMs}ms id=${messageId ?? "—"}`,
    );
    await logEmailEvent({
      kind,
      recipient: logRecipient,
      subject: opts.subject,
      status: "sent",
      durationMs,
      smtpHost: transport,
    });
    return { sent: true, transport, durationMs, ...(messageId ? { messageId } : {}) };
  } catch (err) {
    const failure = classifySmtpError(err);
    const durationMs = Date.now() - startedAt;
    // GDPR: geen recipient in de console-log
    console.error(
      `[email] kind=${kind} route=${transport} status=failed code=${failure.code} duur=${durationMs}ms — ${failure.message}`,
    );
    await logEmailEvent({
      kind,
      recipient: logRecipient,
      subject: opts.subject,
      status: "failed",
      errorCode: failure.code,
      errorMessage: failure.message,
      durationMs,
      smtpHost: transport,
    });
    return { sent: false, reason: failure.code, error: failure.message, transport, durationMs };

  }
}

/* ---------------------------- Huisstijl-shell ---------------------------- */

import {
  ORG,
  MAIL_COLORS,
  button,
  escapeHtml,
  euro,
  infoCard,
  linkFallback,
  mailOrigin,
  publicUrl,
  paragraphs,
  shell as baseShell,
  steps,
  type ShellOptions,
} from "./email-shell";

const TERRA = MAIL_COLORS.terra;
const CREAM = MAIL_COLORS.cream;
const LINE = MAIL_COLORS.line;
const FOREST = MAIL_COLORS.forest;
const MUTED = MAIL_COLORS.muted;

/** Adres en contactmail volgen het portaal (zie applySiteContact). */
const ADDRESS = () => `${ORG.address}, ${ORG.city}`;
const CONTACT_MAIL = () => ORG.email;

/** Basis-URL van de site; SITE_URL uit de omgeving overschrijft de standaard. */
export function siteOrigin(): string {
  return mailOrigin(process.env['PUBLIC_SITE_URL'] || process.env['SITE_URL']);
}

/** Huisstijl-schil met de server-origin (zie email-shell.ts voor de opmaak). */
function shell(opts: Omit<ShellOptions, "origin">): string {
  return baseShell({ ...opts, origin: siteOrigin() });
}

/* ------------------------------ Certificaat ------------------------------ */

export function certificateEmail(p: {
  naam: string;
  academy: string;
  badge: string;
  score: string;
  onderscheiding: boolean;
  url: string;
  datum?: string;
}): { subject: string; html: string } {
  const titel = `${p.academy} Academy — Certificaat`;
  const datum =
    p.datum ??
    new Date().toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });

  const body = `
    <div style="text-align:center;font-size:46px;line-height:1;">${escapeHtml(p.badge || "🏅")}</div>
    <p style="margin:18px 0 0;">Dag ${escapeHtml(p.naam)},</p>
    <p style="margin:12px 0 0;">Proficiat! Je hebt het certificaat <strong>${escapeHtml(titel)}</strong> behaald met een score van <strong>${escapeHtml(p.score)}</strong>.</p>
    ${
      p.onderscheiding
        ? `<p style="margin:16px 0 0;background:#FFF8E6;border:1px solid #D4AF37;border-radius:14px;padding:12px 16px;"><strong style="color:#B4922C;">★ Met onderscheiding ★</strong><br>Een perfecte score — indrukwekkend!</p>`
        : ""
    }
    ${infoCard("Certificaat", titel)}
    ${infoCard("Behaald op", datum)}
    <p style="margin:18px 0 0;">Je digitale certificaat en badge staan vanaf nu in je profiel. Wil je ook het gedrukte exemplaar met stempel? Dat ligt voor je klaar aan het onthaal van de boerderij.</p>
    ${steps("Zo haal je je certificaat op", [
      "Klik op de knop hieronder en open je certificaat in je profiel.",
      "Bewaar of download het als PDF — handig voor school of werk.",
      `Kom langs op ${escapeHtml(ADDRESS())} tijdens de openingsuren en toon deze mail aan het onthaal.`,
      "Wij drukken je certificaat af, zetten er de stempel van de boerderij op en geven het mee.",
    ])}
    <div style="margin:26px 0 8px;">${button(p.url, "Bekijk mijn certificaat")}</div>
    ${linkFallback(p.url)}
    <p style="margin:16px 0 0;font-size:13px;color:${MUTED};">Vragen over je certificaat? Antwoord gerust op deze mail of schrijf naar <a href="mailto:${CONTACT_MAIL()}" style="color:${TERRA};">${CONTACT_MAIL()}</a>.</p>`;

  return {
    subject: `Proficiat! Je behaalde het ${p.academy} Academy-certificaat`,
    html: shell({
      preview: `Je ${p.academy} Academy-certificaat is klaar.`,
      kicker: "Academy",
      title: "Certificaat behaald",
      body,
    }),
  };
}

/* ------------------------------- Bestelling ------------------------------ */

export type OrderLine = { titel: string; aantal: number; prijs_cent: number };

const ORDER_COPY: Record<
  MailLang,
  {
    subject: (nr: string) => string;
    preview: (nr: string) => string;
    kicker: string;
    title: (nr: string) => string;
    hello: (naam: string) => string;
    intro: string;
    total: string;
    pickup: string;
    reference: string;
    qrHint: string;
    stepsTitle: string;
    steps: (afhaalmoment: string, adres: string) => string[];
    cta: string;
    outro: string;
  }
> = {
  nl: {
    subject: (nr) => `Bedankt voor je bestelling ${nr}`,
    preview: (nr) => `Je afhaalbestelling ${nr} is bevestigd.`,
    kicker: "Hoevewinkel",
    title: (nr) => `Bestelling ${nr}`,

    hello: (naam) => `Dag ${naam},`,
    intro:
      "Bedankt voor je bestelling bij de hoevewinkel. Hieronder vind je het overzicht en de betaalreferentie.",
    total: "Totaal",
    pickup: "Afhaalmoment",
    reference: "Betaalreferentie",
    qrHint: "Toon deze code aan de kassa",
    stepsTitle: "Zo verloopt je afhaling",
    steps: (moment, adres) => [
      `Kom langs op <strong>${moment}</strong> aan de hoevewinkel, ${adres}.`,
      "Toon de QR-code of de betaalreferentie hierboven aan de kassa.",
      "Je betaalt ter plaatse (cash of Bancontact) bij het afhalen.",
      "Kan je er niet bij zijn? Antwoord op deze mail en we plannen een nieuw moment.",
    ],
    cta: "Naar de hoevewinkel",
    outro: "Vergeet je eigen tas niet mee te brengen — samen minder verpakking.",
  },
  fr: {
    subject: (nr) => `Merci pour votre commande ${nr}`,
    preview: (nr) => `Votre commande ${nr} est confirmée.`,
    kicker: "Boutique de la ferme",
    title: (nr) => `Commande ${nr}`,

    hello: (naam) => `Bonjour ${naam},`,
    intro:
      "Merci pour votre commande à la boutique de la ferme. Voici le récapitulatif et la référence de paiement.",
    total: "Total",
    pickup: "Moment de retrait",
    reference: "Référence de paiement",
    qrHint: "Montrez ce code à la caisse",
    stepsTitle: "Comment se passe le retrait",
    steps: (moment, adres) => [
      `Passez le <strong>${moment}</strong> à la boutique de la ferme, ${adres}.`,
      "Montrez le QR-code ou la référence de paiement ci-dessus à la caisse.",
      "Le paiement se fait sur place (cash ou Bancontact) lors du retrait.",
      "Empêché·e ? Répondez à cet e-mail et nous fixons un nouveau moment.",
    ],
    cta: "Vers la boutique de la ferme",
    outro: "N'oubliez pas votre sac — ensemble, moins d'emballage.",
  },
  en: {
    subject: (nr) => `Thank you for your order ${nr}`,
    preview: (nr) => `Your pickup order ${nr} is confirmed.`,
    kicker: "Farm shop",
    title: (nr) => `Order ${nr}`,

    hello: (naam) => `Hello ${naam},`,
    intro:
      "Thank you for your order at the farm shop. Below you'll find the overview and the payment reference.",
    total: "Total",
    pickup: "Pickup slot",
    reference: "Payment reference",
    qrHint: "Show this code at the counter",
    stepsTitle: "How your pickup works",
    steps: (moment, adres) => [
      `Drop by on <strong>${moment}</strong> at the farm shop, ${adres}.`,
      "Show the QR code or the payment reference above at the counter.",
      "You pay on the spot (cash or Bancontact) when picking up.",
      "Can't make it? Just reply to this email and we'll arrange a new slot.",
    ],
    cta: "To the farm shop",
    outro: "Don't forget your own bag — less packaging together.",
  },
};

const ORDER_EXTRA_COPY: Record<
  MailLang,
  {
    payOnPickupTitle: string;
    payOnPickupDefault: string;
    paidTitle: string;
    awaitingTitle: string;
    byoBody: string;
    downloadPass: string;
  }
> = {
  nl: {
    payOnPickupTitle: "Te betalen bij afhaling",
    payOnPickupDefault: "Betaal contant of via Payconiq aan de kassa op de stadsboerderij.",
    paidTitle: "✓ Betaald",
    awaitingTitle: "Wacht op overschrijving",
    byoBody:
      "Vergeet niet je eigen herbruikbare zak, emmer of doos mee te brengen bij het ophalen op de stadsboerderij!",
    downloadPass: "Download je afhaalpas (PDF)",
  },
  fr: {
    payOnPickupTitle: "À payer au retrait",
    payOnPickupDefault: "Payez en espèces ou via Payconiq à la caisse de la ferme urbaine.",
    paidTitle: "✓ Payé",
    awaitingTitle: "En attente du virement",
    byoBody:
      "N'oubliez pas d'apporter votre propre sac, seau ou boîte réutilisable lors du retrait à la ferme urbaine !",
    downloadPass: "Télécharger votre pass de retrait (PDF)",
  },
  en: {
    payOnPickupTitle: "Pay on pickup",
    payOnPickupDefault: "Pay in cash or via Payconiq at the counter of the city farm.",
    paidTitle: "✓ Paid",
    awaitingTitle: "Awaiting bank transfer",
    byoBody:
      "Don't forget to bring your own reusable bag, bucket or box when collecting at the city farm!",
    downloadPass: "Download your pickup pass (PDF)",
  },
};

export function orderEmail(p: {
  naam?: string;
  ordernummer: string;
  lijnen: OrderLine[];
  totaal_cent: number;
  afhaalmoment: string;
  code: string;
  lang?: MailLang;
  /** Enkel bij overschrijving: rekening waarop de klant nog moet betalen. */
  bank?: { begunstigde: string; iban: string; bic: string };
  /** Beveiligde afhaal-QR (UUID + HMAC) — vervangt de code-QR. */
  qrUrl?: string;
  /** Downloadbare PDF-afhaalpas. */
  passUrl?: string;
  /** Klant brengt eigen verpakking mee: herinnering tonen. */
  byo?: boolean;
  /** Betalen bij afhaling: amber melding + instructies. */
  payOnPickup?: { notice: string };
}): { subject: string; html: string } {
  const lang: MailLang = p.lang ?? "nl";
  const c = ORDER_COPY[lang];
  const t = MAIL_COPY[lang];
  const x = ORDER_EXTRA_COPY[lang];

  const rows = p.lijnen
    .map(
      (l) =>
        `<tr><td style="padding:9px 0;border-bottom:1px solid ${LINE};">${escapeHtml(l.titel)} <span style="color:${MUTED};">× ${l.aantal}</span></td>
         <td align="right" style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:'Courier New',monospace;">${euro(l.prijs_cent * l.aantal)}</td></tr>`,
    )
    .join("");

  const qr =
    p.qrUrl ??
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(p.code)}`;

  const statusBox = p.payOnPickup
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:14px;padding:14px 18px;">
          <div style="font:700 11px/1 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#92400E;">💶 ${escapeHtml(x.payOnPickupTitle)}</div>
          <div style="margin-top:6px;font:14px/1.5 Arial,Helvetica,sans-serif;color:#78350F;">${escapeHtml(p.payOnPickup.notice || x.payOnPickupDefault)}</div>
        </td></tr></table>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr><td bgcolor="#ECFDF5" style="background:#ECFDF5;border:1px solid #2F5D3A;border-radius:14px;padding:10px 18px;">
          <div style="font:700 11px/1 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#1b3a24;">${escapeHtml(p.bank ? x.awaitingTitle : x.paidTitle)}</div>
        </td></tr></table>`;

  const byoBox = p.byo
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr><td bgcolor="#ECFDF5" style="background:#ECFDF5;border:2px solid #2F5D3A;border-radius:14px;padding:14px 18px;">
          <div style="font:700 12px/1.2 Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#1b3a24;">🌱 BRING YOUR OWN PACKAGING</div>
          <div style="margin-top:6px;font:italic 14px/1.5 Arial,Helvetica,sans-serif;color:#1b3a24;">${escapeHtml(x.byoBody)}</div>
        </td></tr></table>`
    : "";

  const body = `
    <p style="margin:0;">${escapeHtml(c.hello(p.naam?.trim() || t.visitor))}</p>
    <p style="margin:12px 0 0;">${escapeHtml(c.intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;">
      ${rows}
      <tr><td style="padding:13px 0;font-weight:bold;">${escapeHtml(c.total)}</td>
          <td align="right" style="padding:13px 0;font-weight:bold;font-family:'Courier New',monospace;">${euro(p.totaal_cent)}</td></tr>
    </table>
    ${statusBox}
    ${byoBox}
    ${infoCard(c.pickup, p.afhaalmoment)}
    ${infoCard(c.reference, p.code, true)}
    ${
      p.bank
        ? `${infoCard(MAIL_COPY[lang].donation.beneficiary, escapeHtml(p.bank.begunstigde))}
           ${infoCard(MAIL_COPY[lang].donation.iban, escapeHtml(p.bank.iban), true)}
           ${infoCard(MAIL_COPY[lang].donation.bic, escapeHtml(p.bank.bic), true)}
           ${infoCard(c.reference, escapeHtml(p.ordernummer), true)}`
        : ""
    }
    <div style="margin-top:18px;text-align:center;">
      <div style="font:600 10px/1 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${MUTED};">${escapeHtml(c.qrHint)}</div>
      <img src="${qr}" width="180" height="180" alt="${escapeHtml(c.reference)} ${escapeHtml(p.code)}" style="margin:12px auto;display:block;border-radius:12px;">
      ${p.passUrl ? `<a href="${p.passUrl}" style="font:600 13px Arial,Helvetica,sans-serif;color:#2F5D3A;text-decoration:underline;">${escapeHtml(x.downloadPass)}</a>` : ""}
    </div>
    ${steps(c.stepsTitle, c.steps(escapeHtml(p.afhaalmoment), escapeHtml(ADDRESS())))}
    <div style="margin:22px 0 8px;">${button(`${siteOrigin()}/webshop`, c.cta)}</div>
    <p style="margin:18px 0 0;color:${MUTED};font-size:13px;">${escapeHtml(c.outro)}</p>`;

  return {
    subject: c.subject(p.ordernummer),
    html: shell({
      preview: c.preview(p.ordernummer),
      kicker: c.kicker,
      title: c.title(p.ordernummer),
      body,
      lang,
    }),
  };
}

/** Algemene mededeling zonder actielink (drietalig via de aanroeper). */
export function noticeEmail(p: {
  naam?: string;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  lang?: MailLang;
}): { subject: string; html: string } {
  const lang: MailLang = p.lang ?? "nl";
  const t = MAIL_COPY[lang];
  const cta =
    p.ctaLabel && p.ctaUrl
      ? `<div style="margin:26px 0 8px;">${button(p.ctaUrl, p.ctaLabel)}</div>${linkFallback(p.ctaUrl, lang)}`
      : "";
  const body = `
    <p style="margin:0;">${escapeHtml(t.hello(p.naam?.trim() || t.visitor))}</p>
    ${paragraphs(p.message)}
    ${cta}`;
  return {
    subject: `${p.title} — ${FROM_NAME}`,
    html: shell({ preview: p.title, title: p.title, body, lang }),
  };
}


/* --------------------------------- Gift ---------------------------------- */

export function donationEmail(p: {
  naam?: string;
  bedrag_cent: number;
  referentie: string;
  doel?: string;
  iban: string;
  bic: string;
  begunstigde: string;
  lang?: MailLang;
}): { subject: string; html: string } {
  const lang: MailLang = p.lang ?? "nl";
  const t = MAIL_COPY[lang];
  const c = t.donation;
  const body = `
    <p style="margin:0;">${escapeHtml(t.hello(p.naam || t.friend))}</p>
    <p style="margin:12px 0 0;">${escapeHtml(c.intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;">
      <tr><td style="padding:9px 0;border-bottom:1px solid ${LINE};">${escapeHtml(c.lineLabel)}${p.doel ? ` — ${escapeHtml(p.doel)}` : ""}</td>
          <td align="right" style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:'Courier New',monospace;">${euro(p.bedrag_cent)}</td></tr>
      <tr><td style="padding:13px 0;font-weight:bold;">${escapeHtml(c.total)}</td>
          <td align="right" style="padding:13px 0;font-weight:bold;font-family:'Courier New',monospace;">${euro(p.bedrag_cent)}</td></tr>
    </table>
    ${infoCard(c.beneficiary, p.begunstigde)}
    ${infoCard(c.iban, p.iban, true)}
    ${infoCard(c.bic, p.bic, true)}
    ${infoCard(c.reference, p.referentie, true)}
    <p style="margin:18px 0 0;">${escapeHtml(c.thanks)}</p>
    <div style="margin:26px 0 8px;">${button(`${siteOrigin()}/steun`, c.cta)}</div>`;

  return {
    subject: c.subject(euro(p.bedrag_cent)),
    html: shell({
      preview: c.preview(euro(p.bedrag_cent)),
      kicker: c.kicker,
      title: c.title,
      body,
      lang,
    }),
  };
}

/* -------------------------------- Contact -------------------------------- */

export type ContactPayload = {
  onderwerp: string;
  naam: string;
  email: string;
  telefoon?: string;
  bericht: string;
  pagina?: string;
  organisatie?: string;
};

/** Interne melding naar de juiste boerderij-inbox. */
export function contactAdminEmail(p: ContactPayload): { subject: string; html: string } {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:7px 14px 7px 0;color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:1.5px;white-space:nowrap;">${escapeHtml(label)}</td>
           <td style="padding:7px 0;font-size:14px;">${escapeHtml(value)}</td></tr>`
      : "";

  const body = `
    <p style="margin:0;">Er kwam een nieuw bericht binnen via de website.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px;width:100%;">
      ${row("Onderwerp", p.onderwerp)}
      ${row("Naam", p.naam)}
      ${row("Organisatie", p.organisatie)}
      ${row("E-mail", p.email)}
      ${row("Telefoon", p.telefoon)}
      ${row("Pagina", p.pagina)}
    </table>
    <div style="margin-top:18px;background:${CREAM};border:1px solid ${LINE};border-radius:16px;padding:18px;">
      ${paragraphs(p.bericht)}
    </div>
    <div style="margin:26px 0 8px;">${button(`mailto:${p.email}?subject=${encodeURIComponent(`Re: ${p.onderwerp}`)}`, "Antwoord versturen")}</div>`;

  return {
    subject: `[Website] ${p.onderwerp} — ${p.naam}`,
    html: shell({
      preview: `Nieuw bericht van ${p.naam} (${p.onderwerp}).`,
      kicker: "Nieuw bericht",
      title: p.onderwerp,
      body,
    }),
  };
}

/** Ontvangstbevestiging naar de afzender (in de taal van de bezoeker). */
export function contactReceiptEmail(p: ContactPayload & { lang?: MailLang }): {
  subject: string;
  html: string;
} {
  const lang: MailLang = p.lang ?? "nl";
  const t = MAIL_COPY[lang];
  const c = t.contactReceipt;
  const body = `
    <p style="margin:0;">${escapeHtml(t.hello(p.naam || t.visitor))}</p>
    <p style="margin:12px 0 0;">${escapeHtml(c.intro)}</p>
    ${infoCard(c.subjectLabel, p.onderwerp)}
    <div style="margin-top:16px;background:${CREAM};border:1px solid ${LINE};border-radius:16px;padding:18px;color:${MAIL_COLORS.ink};">
      ${paragraphs(p.bericht)}
    </div>
    <p style="margin:18px 0 0;">${escapeHtml(c.urgent("")).trim()} <a href="mailto:${CONTACT_MAIL()}" style="color:${TERRA};">${CONTACT_MAIL()}</a></p>
    <div style="margin:26px 0 8px;">${button(publicUrl("visit", lang, siteOrigin()), c.cta)}</div>`;

  return {
    subject: c.subject(p.onderwerp),
    html: shell({ preview: c.preview, kicker: c.kicker, title: c.title, body, lang }),
  };
}

/* ------------------------- Systeemtest (admin-only) ----------------------- */

/** Toont welke afzenderidentiteit de SMTP-server gebruikt (zonder wachtwoorden). */
export async function senderIdentity(): Promise<string> {
  return fromHeader(await resolveSmtpConfig());
}

/**
 * Volledig opgemaakte testmail: bevestigt in één oogopslag dat SMTP, huisstijl
 * en de koppeling met de databank werken.
 */
export function systemTestEmail(): { subject: string; html: string } {
  const origin = siteOrigin();
  const punten = [
    "Verzonden via soevereine Europese infrastructuur (Infomaniak / Brevo)",
    "Volledig opgemaakt in de huisstijl van de boerderij: logo, kleuren en voettekst",
    "Alle sociale kanalen en contactgegevens staan in de voettekst",
  ];
  const body = `
    <p style="margin:0;">Dit is een automatisch testbericht om te bevestigen dat alle transactionele e-mails (certificaten, bestelbevestigingen, boekingen, inlogcodes en contactaanvragen) correct vertrekken en er goed uitzien.</p>
    ${steps("Wat deze test bevestigt", punten)}
    <div style="margin:28px 0 8px;">${button(`${origin}/`, "Bekijk de website")}</div>
    <p style="margin:18px 0 0;font-size:13px;color:${MUTED};">Ziet deze mail er niet uit zoals verwacht (logo ontbreekt, voettekst breekt af)? Meld het aan <a href="mailto:${CONTACT_MAIL()}" style="color:${TERRA};">${CONTACT_MAIL()}</a> met een schermafbeelding en de naam van je mailprogramma.</p>`;

  return {
    subject: "Systeemcheck: het e-mailsysteem van de boerderij werkt",
    html: shell({
      preview: "Testbericht: het e-mailsysteem van de boerderij werkt.",
      kicker: "Systeemcheck",
      title: "Het e-mailsysteem werkt",
      body,
    }),
  };
}

/* --------------------------- Accountbeveiliging --------------------------- */

/** Bevestigingsmail bij registratie — link komt uit de auth-provider. */
export function verifyEmailEmail(p: { naam?: string; url: string; lang?: MailLang }): {
  subject: string;
  html: string;
} {
  const lang: MailLang = p.lang ?? "nl";
  const t = MAIL_COPY[lang];
  const c = t.verify;
  const body = `
    <p style="margin:0;">${escapeHtml(t.hello(p.naam?.trim() || t.visitor))}</p>
    <p style="margin:12px 0 0;">${escapeHtml(c.intro)}</p>
    <div style="margin:28px 0 8px;">${button(p.url, c.cta)}</div>
    ${linkFallback(p.url, lang)}
    <p style="margin:18px 0 0;font-size:13px;color:${MUTED};">${escapeHtml(c.small)}</p>`;

  return {
    subject: c.subject,
    html: shell({ preview: c.preview, kicker: c.kicker, title: c.title, body, lang }),
  };
}

/** Herstelmail voor een vergeten wachtwoord. */
export function passwordResetEmail(p: { naam?: string; url: string; lang?: MailLang }): {
  subject: string;
  html: string;
} {
  const lang: MailLang = p.lang ?? "nl";
  const t = MAIL_COPY[lang];
  const c = t.reset;
  const body = `
    <p style="margin:0;">${escapeHtml(t.hello(p.naam?.trim() || t.visitor))}</p>
    <p style="margin:12px 0 0;">${escapeHtml(c.intro)}</p>
    <div style="margin:28px 0 8px;">${button(p.url, c.cta)}</div>
    ${linkFallback(p.url, lang)}
    <p style="margin:18px 0 0;font-size:13px;color:${MUTED};">${escapeHtml(c.small)}</p>`;

  return {
    subject: c.subject,
    html: shell({ preview: c.preview, kicker: c.kicker, title: c.title, body, lang }),
  };
}

/* ------------------- Account- en beveiligingsmails (1–8) ------------------- */

/**
 * Eén generieke bouwer voor alle account- en beveiligingsmails, zodat elke
 * taal en elk sjabloon exact dezelfde huisstijl en structuur krijgt.
 */
const CODE_COPY: Record<MailLang, { label: string; hint: string }> = {
  nl: {
    label: "Of vul deze code in op de inlogpagina",
    hint: "De code is 15 minuten geldig en werkt één keer.",
  },
  fr: {
    label: "Ou saisissez ce code sur la page de connexion",
    hint: "Le code est valable 15 minutes et ne fonctionne qu'une fois.",
  },
  en: {
    label: "Or enter this code on the login page",
    hint: "The code is valid for 15 minutes and works once.",
  },
};

export function authActionEmail(
  kind: AuthMailKind,
  p: { naam?: string; url?: string; lang?: MailLang; code?: string },
): { subject: string; html: string } {
  const lang: MailLang = p.lang ?? "nl";
  const t = MAIL_COPY[lang];
  const c = AUTH_MAIL_COPY[lang][kind];
  const url = p.url ?? `${siteOrigin()}/account`;
  const cc = CODE_COPY[lang];
  const codeBlock = p.code
    ? `<div style="margin:24px 0 0;text-align:center;">
         <p style="margin:0;font-size:13px;color:${MUTED};">${escapeHtml(cc.label)}</p>
         <p style="margin:8px 0 0;font-size:30px;letter-spacing:8px;font-weight:700;">${escapeHtml(p.code)}</p>
         <p style="margin:6px 0 0;font-size:12px;color:${MUTED};">${escapeHtml(cc.hint)}</p>
       </div>`
    : "";
  const body = `
    <p style="margin:0;">${escapeHtml(t.hello(p.naam?.trim() || t.visitor))}</p>
    <p style="margin:12px 0 0;">${escapeHtml(c.intro)}</p>
    ${c.cta ? `<div style="margin:28px 0 8px;">${button(url, c.cta)}</div>${linkFallback(url, lang)}` : ""}
    ${codeBlock}
    <p style="margin:18px 0 0;font-size:13px;color:${MUTED};">${escapeHtml(c.small)}</p>`;

  return {
    subject: `${c.subject} — ${FROM_NAME}`,
    html: shell({ preview: c.preview, kicker: c.kicker, title: c.title, body, lang }),
  };
}

/* ------------------------------- Boeking --------------------------------- */

const BOOKING_COPY: Record<
  MailLang,
  {
    subject: (ref: string) => string;
    preview: string;
    kicker: string;
    title: string;
    hello: (naam: string) => string;
    intro: string;
    labels: { formule: string; datum: string; personen: string; betaald: string; ref: string };
    steps: [string, string, string, string];
    stepsTitle: string;
    cta: string;
    outro: string;
  }
> = {
  nl: {
    subject: (ref) => `Je boeking is bevestigd — ${ref}`,
    preview: "Je betaling is ontvangen en je boeking staat vast.",
    kicker: "Boeking",
    title: "Boeking bevestigd",
    hello: (naam) => `Dag ${naam},`,
    intro: "Je betaling is goed ontvangen. Hieronder staan de details van je boeking.",
    labels: {
      formule: "Formule",
      datum: "Datum",
      personen: "Aantal personen",
      betaald: "Betaald bedrag",
      ref: "Boekingsreferentie",
    },
    stepsTitle: "Wat gebeurt er nu?",
    steps: [
      "Wij zetten je boeking definitief in de agenda van de boerderij.",
      "Een medewerker neemt binnen twee werkdagen contact op voor de praktische afspraken.",
      "Hou deze mail bij: de referentie hierboven is je bewijs van betaling.",
      "Iets wijzigen of annuleren? Antwoord gewoon op deze mail.",
    ],
    cta: "Bekijk de boerderij",
    outro: "Tot binnenkort op de stadsboerderij!",
  },
  fr: {
    subject: (ref) => `Votre réservation est confirmée — ${ref}`,
    preview: "Votre paiement est reçu et votre réservation est confirmée.",
    kicker: "Réservation",
    title: "Réservation confirmée",
    hello: (naam) => `Bonjour ${naam},`,
    intro: "Nous avons bien reçu votre paiement. Voici les détails de votre réservation.",
    labels: {
      formule: "Formule",
      datum: "Date",
      personen: "Nombre de personnes",
      betaald: "Montant payé",
      ref: "Référence de réservation",
    },
    stepsTitle: "Et maintenant ?",
    steps: [
      "Nous inscrivons définitivement votre réservation dans l'agenda de la ferme.",
      "Un collaborateur vous contacte dans les deux jours ouvrables pour les détails pratiques.",
      "Conservez cet e-mail : la référence ci-dessus est votre preuve de paiement.",
      "Une modification ou une annulation ? Répondez simplement à cet e-mail.",
    ],
    cta: "Découvrir la ferme",
    outro: "À bientôt à la ferme urbaine !",
  },
  en: {
    subject: (ref) => `Your booking is confirmed — ${ref}`,
    preview: "Your payment was received and your booking is confirmed.",
    kicker: "Booking",
    title: "Booking confirmed",
    hello: (naam) => `Hi ${naam},`,
    intro: "We received your payment. Here are the details of your booking.",
    labels: {
      formule: "Package",
      datum: "Date",
      personen: "Number of people",
      betaald: "Amount paid",
      ref: "Booking reference",
    },
    stepsTitle: "What happens next?",
    steps: [
      "We add your booking to the farm's calendar for good.",
      "A team member contacts you within two working days about the practical details.",
      "Keep this email: the reference above is your proof of payment.",
      "Need a change or a cancellation? Just reply to this email.",
    ],
    cta: "Visit the farm",
    outro: "See you soon at the city farm!",
  },
};

export function bookingPaidEmail(p: {
  naam: string;
  referentie: string;
  formule: string;
  datum: string;
  personen: number;
  bedrag_cent: number;
  lang?: MailLang;
}): { subject: string; html: string } {
  const lang: MailLang = p.lang ?? "nl";
  const c = BOOKING_COPY[lang];

  const body = `
    <p style="margin:0;">${escapeHtml(c.hello(p.naam))}</p>
    <p style="margin:12px 0 0;">${escapeHtml(c.intro)}</p>
    ${infoCard(c.labels.formule, p.formule)}
    ${infoCard(c.labels.datum, p.datum)}
    ${infoCard(c.labels.personen, String(p.personen))}
    ${infoCard(c.labels.betaald, euro(p.bedrag_cent))}
    ${infoCard(c.labels.ref, p.referentie, true)}
    ${steps(c.stepsTitle, [...c.steps])}
    <div style="margin:24px 0 8px;">${button(siteOrigin(), c.cta)}</div>
    <p style="margin:16px 0 0;color:${MUTED};font-size:13px;">${escapeHtml(c.outro)}</p>`;

  return {
    subject: c.subject(p.referentie),
    html: shell({ preview: c.preview, kicker: c.kicker, title: c.title, body, lang }),
  };
}
