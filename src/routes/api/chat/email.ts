/**
 * Stuurt een overzicht uit de chat (bezoekplanning, tarievenlijst, afhaalcode …)
 * per e-mail naar de bezoeker. Enkel de inhoud van het chatantwoord wordt
 * verstuurd; de bezoeker geeft zelf zijn adres op.
 */
import { createFileRoute } from "@tanstack/react-router";

type Lang = "nl" | "fr" | "en";

type Body = {
  to?: string;
  content?: string;
  lang?: Lang;
  title?: string;
};

const SUBJECT: Record<Lang, string> = {
  nl: "Jouw overzicht van Maximilien",
  fr: "Votre récapitulatif de Maximilien",
  en: "Your overview from Maximilien",
};

const INTRO: Record<Lang, string> = {
  nl: "Hier is het overzicht dat je in de chat met Maxim vroeg. Tot binnenkort op de boerderij!",
  fr: "Voici le récapitulatif demandé dans le chat avec Maxim. À bientôt à la ferme !",
  en: "Here is the overview you asked Maxim for in the chat. See you at the farm!",
};

const FOOTER: Record<Lang, string> = {
  nl: "Stadsboerderij Maximilien · Schipperijkaai 2, 1000 Brussel · gratis toegang",
  fr: "Ferme urbaine Maximilien · Quai du Batelage 2, 1000 Bruxelles · entrée gratuite",
  en: "City farm Maximilien · Quai du Batelage 2, 1000 Brussels · free entry",
};

const MAX_CONTENT = 8_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Simpele anti-misbruiklimiet: max 3 mails per IP per 10 minuten. */
const WINDOW_MS = 10 * 60_000;
const hits = new Map<string, number[]>();
function allow(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= 3) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Zet de Markdown van het antwoord om naar eenvoudige, veilige mail-HTML. */
function toHtml(text: string): string {
  const rows: string[] = [];
  let table: string[] = [];
  const flush = () => {
    if (!table.length) return;
    rows.push(
      `<table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0">${table.join("")}</table>`,
    );
    table = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue;
    if (/^\s*\|/.test(line)) {
      const cells = line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map(
          (c) =>
            `<td style="border:1px solid #d7cfc4;padding:6px 8px">${escapeHtml(c.trim())}</td>`,
        )
        .join("");
      table.push(`<tr>${cells}</tr>`);
      continue;
    }
    flush();
    const clean = line.replace(/^\s*-\s\[[ xX]\]\s/, "☐ ").trim();
    if (clean) rows.push(`<p style="margin:8px 0;line-height:1.6">${escapeHtml(clean)}</p>`);
  }
  flush();
  return rows.join("\n");
}

export const Route = createFileRoute("/api/chat/email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);

        const { requireRouteAuth } = await import("@/lib/route-auth.server");
        const guard = await requireRouteAuth(request);
        if ("response" in guard) return guard.response;
        const body = (await request.json().catch(() => ({}))) as Body;
        const lang: Lang = body.lang === "fr" || body.lang === "en" ? body.lang : "nl";
        // Enkel naar het eigen e-mailadres van de ingelogde gebruiker.
        const to = (guard.auth.email ?? "").trim();
        const content = typeof body.content === "string" ? body.content.slice(0, MAX_CONTENT) : "";

        if (!EMAIL_RE.test(to) || content.trim().length < 10) {
          return Response.json({ sent: false, error: "invalid_input" }, { status: 400 });
        }
        if (!allow(ip)) {
          return Response.json({ sent: false, error: "rate_limited" }, { status: 429 });
        }

        const { brevoEnv, brevoRoute, buildBrevoPayload } = await import("@/lib/brevo");
        const apiKey = brevoEnv("BREVO_API_KEY");
        if (!apiKey) {
          console.error("[chat-email] BREVO_API_KEY ontbreekt");
          return Response.json({ sent: false, error: "not_configured" }, { status: 503 });
        }

        const heading = escapeHtml((body.title ?? SUBJECT[lang]).slice(0, 120));
        const html = `<!doctype html><html lang="${lang}"><body style="margin:0;background:#f7f3ec;font-family:Arial,Helvetica,sans-serif;color:#2c2a26">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;color:#1f3a24;margin:0 0 8px">${heading}</h1>
  <p style="margin:0 0 16px;line-height:1.6">${escapeHtml(INTRO[lang])}</p>
  <div style="background:#ffffff;border:1px solid #e6ded2;border-radius:14px;padding:16px">${toHtml(content)}</div>
  <p style="margin:20px 0 0;font-size:12px;color:#6b6459">${escapeHtml(FOOTER[lang])}</p>
</div></body></html>`;

        const route = brevoRoute(apiKey, brevoEnv("LOVABLE_API_KEY"));
        const payload = buildBrevoPayload({
          to,
          subject: SUBJECT[lang],
          htmlContent: html,
          textContent: content,
          transactional: true,
        });

        try {
          const res = await fetch(route.url("smtp/email"), {
            method: "POST",
            headers: route.headers,
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            console.error("[chat-email] Brevo-fout", res.status, detail.slice(0, 300));
            return Response.json({ sent: false, error: "send_failed" }, { status: 502 });
          }
          return Response.json({ sent: true });
        } catch (error) {
          console.error("[chat-email] verzenden mislukt", error);
          return Response.json({ sent: false, error: "send_failed" }, { status: 502 });
        }
      },
    },
  },
});
