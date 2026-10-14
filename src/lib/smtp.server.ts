/**
 * Server-only SMTP-configuratie en foutdiagnose.
 *
 * De instellingen komen uit twee bronnen, in deze volgorde:
 *   1. de tabel `smtp_config` (beheerbaar via het portaal, enkel server-side leesbaar)
 *   2. de environment variables SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
 *
 * Elke verzendpoging wordt gelogd in `email_events` met een leesbare foutcode,
 * zodat een beheerder meteen ziet waarom een mail niet aankwam. Er wordt nooit
 * een volledig e-mailadres of wachtwoord gelogd (GDPR).
 */

export type SmtpSource = "database" | "environment" | "none";

export type SmtpConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  secure: boolean;
  source: SmtpSource;
};

export type SmtpConfigStatus = {
  host: string;
  port: number | null;
  username: string;
  fromAddress: string;
  fromName: string;
  secure: boolean;
  passwordSet: boolean;
  source: SmtpSource;
  complete: boolean;
};

const DEFAULT_FROM_NAME = "Maximilien";
/** Vaste huisstijl-terugval; BREVO_SENDER_EMAIL uit de omgeving gaat altijd voor. */
const DEFAULT_FROM_ADDRESS = "no-reply@send.maximilien.site";

/** Afzenderadres: eerst BREVO_SENDER_EMAIL, dan SMTP_FROM, dan de terugval. */
function envFromAddress(): string {
  const brevoSender = process.env.BREVO_SENDER_EMAIL?.trim();
  return brevoSender || process.env.SMTP_FROM?.trim() || "";
}

function parsePort(value: unknown, fallback: number): number {
  const digits = String(value ?? "").match(/\d+/);
  return digits ? Number(digits[0]) : fallback;
}

/** Haalt "Naam <adres@x>" uit elkaar. */
function splitFrom(raw: string): { name: string; address: string } {
  const value = raw.trim();
  if (!value) return { name: DEFAULT_FROM_NAME, address: DEFAULT_FROM_ADDRESS };
  if (value.includes("<")) {
    const address = value.slice(value.indexOf("<") + 1, value.lastIndexOf(">")).trim();
    const name = value.slice(0, value.indexOf("<")).replace(/["']/g, "").trim();
    return { name: name || DEFAULT_FROM_NAME, address: address || DEFAULT_FROM_ADDRESS };
  }
  return { name: DEFAULT_FROM_NAME, address: value };
}

type DbRow = {
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  from_address: string | null;
  from_name: string | null;
  secure: boolean | null;
};

async function readDbConfig(): Promise<DbRow | null> {
  try {
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { data, error } = await dbAdmin
      .from("smtp_config")
      .select("host, port, username, password, from_address, from_name, secure")
      .maybeSingle();
    if (error) {
      console.warn(`[email] mailserverinstellingen niet leesbaar: ${error.message}`);
      return null;
    }
    return (data as DbRow | null) ?? null;
  } catch (err) {
    console.warn(`[email] mailserverinstellingen niet leesbaar: ${(err as Error).message}`);
    return null;
  }
}

/** Volledige configuratie inclusief wachtwoord — nooit naar de browser sturen. */
export async function resolveSmtpConfig(): Promise<SmtpConfig> {
  const db = await readDbConfig();
  const dbComplete = Boolean(db?.host && db?.username && db?.password);

  const envFrom = splitFrom(envFromAddress());
  const envFromName = process.env.BREVO_SENDER_NAME?.trim() || envFrom.name;
  const host = (dbComplete ? db!.host : process.env.SMTP_HOST) ?? "";
  const username = (dbComplete ? db!.username : process.env.SMTP_USER) ?? "";
  const password = (dbComplete ? db!.password : process.env.SMTP_PASS) ?? "";
  const port = dbComplete ? parsePort(db!.port, 465) : parsePort(process.env.SMTP_PORT, 465);

  // Afzender mag altijd uit de databank komen, ook als de rest uit de omgeving komt.
  const fromAddress = (
    db?.from_address ||
    (dbComplete ? "" : envFrom.address) ||
    envFrom.address
  ).trim();
  const fromName = (db?.from_name || envFromName || DEFAULT_FROM_NAME).trim();
  const secure = db?.secure ?? port === 465;

  return {
    host: host.trim(),
    port,
    username: username.trim(),
    password,
    fromAddress: fromAddress || DEFAULT_FROM_ADDRESS,
    fromName: fromName || DEFAULT_FROM_NAME,
    secure,
    source: dbComplete ? "database" : host ? "environment" : "none",
  };
}

/** Versie zonder geheimen, veilig om in het beheerportaal te tonen. */
export async function smtpConfigStatus(): Promise<SmtpConfigStatus> {
  const cfg = await resolveSmtpConfig();
  return {
    host: cfg.host,
    port: cfg.host ? cfg.port : null,
    username: cfg.username,
    fromAddress: cfg.fromAddress,
    fromName: cfg.fromName,
    secure: cfg.secure,
    passwordSet: Boolean(cfg.password),
    source: cfg.source,
    complete: Boolean(cfg.host && cfg.username && cfg.password),
  };
}

/** j***@example.com — genoeg om te herkennen, niet genoeg om te profileren. */
export function maskEmail(value: string): string {
  const [local, domain] = String(value).split("@");
  if (!domain) return "onbekend";
  const head = local.slice(0, 1) || "?";
  return `${head}${"*".repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

export type SmtpFailure = { code: string; message: string };

/** Vertaalt een ruwe SMTP-fout naar een begrijpelijke oorzaak + oplossing. */
export function classifySmtpError(err: unknown): SmtpFailure {
  const raw = err instanceof Error ? err.message : String(err);
  const text = raw.toLowerCase();

  if (text.includes("cloudflare:sockets") || text.includes("not implemented")) {
    return {
      code: "runtime_unsupported",
      message:
        "Verzenden werkt enkel op de gepubliceerde site: de preview-omgeving heeft geen uitgaande SMTP-verbinding.",
    };
  }
  // Brevo-API weigert de sleutel of het IP-adres (401/403) — geen ruwe JSON tonen.
  if (/brevo 40[13]/.test(text) || text.includes("unrecognised ip") || text.includes("unrecognized ip")) {
    return {
      code: "mail_unauthorized",
      message:
        "De mailprovider weigerde de aanvraag (sleutel of IP-beperking). De mail werd niet verstuurd.",
    };
  }
  if (/brevo 429/.test(text)) {
    return {
      code: "mail_rate_limited",
      message: "De mailprovider ontving te veel aanvragen. Probeer het straks opnieuw.",
    };
  }
  if (/brevo 5\d\d/.test(text)) {
    return {
      code: "mail_provider_error",
      message: "De mailprovider is tijdelijk onbereikbaar. Probeer het straks opnieuw.",
    };
  }
  if (text.includes("535") || text.includes("auth") || text.includes("credential")) {
    return {
      code: "auth_failed",
      message: `De mailserver weigerde de aanmelding — controleer gebruikersnaam en wachtwoord. (${raw})`,
    };
  }
  if (text.includes("timed out") || text.includes("timeout")) {
    return {
      code: "timeout",
      message: `Geen antwoord van ${"de mailserver"} binnen de tijdslimiet — controleer host en poort. (${raw})`,
    };
  }
  if (text.includes("refused") || text.includes("econnrefused") || text.includes("connect")) {
    return {
      code: "connection_refused",
      message: `Kon geen verbinding maken met de mailserver — controleer host en poort (465 = SSL, 587 = STARTTLS). (${raw})`,
    };
  }
  if (text.includes("tls") || text.includes("ssl") || text.includes("certificate")) {
    return {
      code: "tls_error",
      message: `Beveiligde verbinding mislukt — probeer poort 465 met SSL of 587 met STARTTLS. (${raw})`,
    };
  }
  if (text.includes("550") || text.includes("relay") || text.includes("not allowed")) {
    return {
      code: "rejected",
      message: `De mailserver weigerde het bericht — vaak omdat het afzenderadres niet bij dit account hoort. (${raw})`,
    };
  }
  return { code: "smtp_error", message: raw };
}

/** Schrijft één regel in het maillogboek. Faalt nooit hard. */
export async function logEmailEvent(entry: {
  kind: string;
  recipient: string;
  subject?: string;
  status: "sent" | "failed" | "skipped";
  errorCode?: string | null;
  errorMessage?: string | null;
  durationMs?: number | null;
  smtpHost?: string | null;
}): Promise<void> {
  try {
    const { dbAdmin } = await import("@/lib/db-admin.server");
    await dbAdmin.from("email_events").insert({
      kind: entry.kind,
      recipient_masked: maskEmail(entry.recipient),
      subject: entry.subject ?? null,
      status: entry.status,
      error_code: entry.errorCode ?? null,
      error_message: entry.errorMessage ? entry.errorMessage.slice(0, 800) : null,
      duration_ms: entry.durationMs ?? null,
      smtp_host: entry.smtpHost ?? null,
    });
  } catch (err) {
    console.warn(`[email] logboek niet beschikbaar: ${(err as Error).message}`);
  }
}
