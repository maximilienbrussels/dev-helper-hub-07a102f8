/**
 * Diagnose "Inloggen & mail": toont per onderdeel of het werkt.
 *
 * Bedoeld voor beheerders met het recht `manage_settings`. Geheime waarden
 * verlaten de server nooit: enkel of ze bestaan, hun lengte en een prefix.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";

export type CheckStatus = "ok" | "warn" | "fail";

export type DiagnosticCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  hint?: string;
};

export type LoginDiagnostics = {
  checks: DiagnosticCheck[];
  authUrl: string;
  redirectUris: string[];
  origins: string[];
};

const PROVIDERS = ["google", "github"] as const;

export const diagnoseLoginAndMail = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<LoginDiagnostics> => {
    const { requirePermission } = await import("./portal-permissions");
    await requirePermission(context as never, "manage_settings");

    const checks: DiagnosticCheck[] = [];

    /* ---------------------------- Database ---------------------------- */
    const { connectionString } = await import("./neon.server");
    const dbUrl = connectionString();
    checks.push({
      id: "database",
      label: "Databaseverbinding",
      status: dbUrl ? "ok" : "fail",
      detail: dbUrl
        ? "Verbindingsreeks gevonden (DATABASE_URL / NEON_DATABASE_URL)."
        : "Geen DATABASE_URL of NEON_DATABASE_URL ingesteld.",
      ...(dbUrl
        ? {}
        : {
            hint: "Zonder database kunnen inloglinks en de 6-cijferige inlogcode niet aangemaakt worden.",
          }),
    });

    /* ------------------------------ Mail ------------------------------ */
    const { brevoApiKey } = await import("./brevo-override.server");
    const { smtpConfigStatus } = await import("./smtp.server");
    const key = brevoApiKey();
    const cfg = await smtpConfigStatus();

    checks.push({
      id: "brevo",
      label: "Brevo API-sleutel",
      status: key ? "ok" : "fail",
      detail: key
        ? `Sleutel aanwezig (${key.slice(0, 8)}…, ${key.length} tekens).`
        : "BREVO_API_KEY ontbreekt — er wordt geen enkele mail verstuurd.",
      ...(key ? {} : { hint: "Zet BREVO_API_KEY als geheime sleutel in het project." }),
    });

    const fromDomain = cfg.fromAddress.split("@")[1] ?? "";
    const knownDomain = [
      "maximilien.site",
      "send.maximilien.site",
      "maximilien.brussels",
    ].includes(fromDomain);
    checks.push({
      id: "sender",
      label: "Afzenderdomein",
      status: cfg.fromAddress ? (knownDomain ? "ok" : "warn") : "fail",
      detail: cfg.fromAddress
        ? `${cfg.fromName} <${cfg.fromAddress}>`
        : "Geen afzenderadres ingesteld.",
      hint: fromDomain
        ? `Het domein ${fromDomain} moet in Brevo geverifieerd zijn (SPF + DKIM). Aanbevolen afzender: no-reply@send.maximilien.site.`
        : "Stel een afzenderadres in, bij voorkeur no-reply@send.maximilien.site.",
    });

    /* ---------------------------- Neon Auth --------------------------- */
    const { neonAuthUrl } = await import("./neon-data.server");
    const { NEON_AUTH_URL } = await import("./neon");
    const authUrl = (neonAuthUrl() || NEON_AUTH_URL).replace(/\/+$/, "");

    let reachable = false;
    let authDetail = "Geen auth-URL ingesteld.";
    if (authUrl) {
      try {
        const res = await fetch(`${authUrl}/get-session`, {
          signal: AbortSignal.timeout(8000),
        });
        reachable = res.status < 500;
        authDetail = `Auth-endpoint antwoordt met HTTP ${res.status}.`;
      } catch (error) {
        authDetail = `Auth-endpoint niet bereikbaar: ${
          error instanceof Error ? error.message : "onbekend"
        }`;
      }
    }
    checks.push({
      id: "auth-url",
      label: "Neon Auth-endpoint",
      status: reachable ? "ok" : "fail",
      detail: `${authUrl || "—"} — ${authDetail}`,
      ...(process.env["NEON_AUTH_URL"]
        ? {}
        : { hint: "NEON_AUTH_URL / VITE_NEON_AUTH_URL staan niet ingesteld; de code gebruikt de vaste waarde uit de broncode." }),
    });

    /* ------------------------ Sociale providers ----------------------- */
    for (const provider of PROVIDERS) {
      let status: CheckStatus = "fail";
      let detail = "Niet getest.";
      if (authUrl && reachable) {
        try {
          const res = await fetch(`${authUrl}/sign-in/social`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            // Een absolute callback wordt door Neon geweigerd wanneer het
            // domein niet exact in Trusted Origins staat. De app gebruikt om
            // die reden overal een relatief, veilig terugkeerpad.
            body: JSON.stringify({ provider, callbackURL: "/account" }),
            signal: AbortSignal.timeout(8000),
          });
          const body = (await res.json().catch(() => null)) as { url?: string } | null;
          if (res.ok && body?.url) {
            status = "ok";
            detail = "Provider actief: Neon Auth geeft een geldige aanmeld-URL terug.";
          } else {
            detail = `Provider niet ingesteld (HTTP ${res.status}).`;
          }
        } catch (error) {
          detail = `Test mislukt: ${error instanceof Error ? error.message : "onbekend"}`;
        }
      } else {
        detail = "Auth-endpoint is niet bereikbaar, provider kan niet getest worden.";
      }
      checks.push({
        id: `oauth-${provider}`,
        label: `Inloggen met ${provider}`,
        status,
        detail,
        ...(status === "ok"
          ? {}
          : {
               hint: `Zet de provider aan in Neon Auth met client-id/secret en gebruik ${authUrl}/callback/${provider} als redirect-URI. Voeg daarnaast elk publiek site-domein toe aan Trusted Origins.`,
            }),
      });
    }

    return {
      checks,
      authUrl,
      redirectUris: PROVIDERS.map((p) => `${authUrl}/callback/${p}`),
      origins: [
        "https://maximilien.brussels",
        "https://www.maximilien.brussels",
        "https://maximilien.site",
        "https://www.maximilien.site",
        "https://maximilien.app",
        "https://www.maximilien.app",
        "http://localhost:8080",
      ],
    };
  });
