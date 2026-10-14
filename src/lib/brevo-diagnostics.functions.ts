import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Diepe Brevo-diagnose voor de vaste super-admin.
 *
 * Geeft de exacte reden terug waarom verzending faalt (ontbrekende sleutel,
 * verkeerde route, HTTP-status en foutbody van Brevo of de Lovable-gateway).
 * Sleutelwaarden verlaten de server nooit: enkel lengte en prefix.
 */
export const diagnoseBrevo = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(254),
        sendTest: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { isSuperAdminEmail } = await import("./superadmin");
    if (!isSuperAdminEmail(data.email)) {
      throw new Error("Diagnose is enkel beschikbaar voor de hoofdbeheerder.");
    }

    const { brevoEnv, buildBrevoPayload, brevoSender, brevoReplyTo, brevoRoute } = await import("./brevo");
    const { brevoApiKey } = await import("./brevo-override.server");

    const apiKey = brevoApiKey();
    const lovableKey = brevoEnv("LOVABLE_API_KEY");
    const sender = brevoSender();
    const replyTo = brevoReplyTo();

    const redact = (text: string) => {
      let out = text.slice(0, 600);
      for (const secret of [apiKey, lovableKey]) {
        if (secret && secret.length > 6) out = out.split(secret).join("«verborgen»");
      }
      return out;
    };

    const env = {
      brevoKeyPresent: Boolean(apiKey),
      brevoKeyLength: apiKey?.length ?? 0,
      brevoKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}…` : null,
      lovableKeyPresent: Boolean(lovableKey),
      senderEmail: sender.email,
      senderName: sender.name,
      replyTo: replyTo.email,
      nodeEnv: brevoEnv("NODE_ENV") ?? null,
      vercelEnv: brevoEnv("VERCEL_ENV") ?? null,
    };

    const routing = apiKey ? brevoRoute(apiKey, lovableKey) : null;
    const route = routing ? routing.label : ("geen sleutel" as const);

    if (!apiKey) {
      return {
        env,
        route,
        account: null,
        testSend: null,
        verdict:
          "BREVO_API_KEY is niet zichtbaar in de serveromgeving. Zet de variabele in de hosting-omgeving (Vercel: Project → Settings → Environment Variables, scope Production) en deploy opnieuw.",
      };
    }

    const routing2 = brevoRoute(apiKey, lovableKey);
    const gateway = routing2.gateway;
    const headers: Record<string, string> = routing2.headers;

    async function probe(url: string, init?: RequestInit) {
      const started = Date.now();
      try {
        const res = await fetch(url, { ...init, headers });
        const body = await res.text().catch(() => "");
        return {
          url,
          status: res.status,
          ok: res.ok,
          ms: Date.now() - started,
          body: redact(body),
        };
      } catch (error) {
        return {
          url,
          status: 0,
          ok: false,
          ms: Date.now() - started,
          body: redact(error instanceof Error ? error.message : "netwerkfout"),
        };
      }
    }

    const account = await probe(
      routing2.url("account"),
    );

    let testSend: Awaited<ReturnType<typeof probe>> | null = null;
    if (data.sendTest) {
      testSend = await probe(
        routing2.url("smtp/email"),
        {
          method: "POST",
          body: JSON.stringify(
            buildBrevoPayload({
              to: data.email,
              subject: "Brevo-diagnose — testbericht",
              htmlContent:
                "<p>Dit is een testbericht van de Brevo-diagnose op /auth. Ontvang je dit, dan werkt verzending.</p>",
            }),
          ),
        },
      );
    }

    const failing = testSend && !testSend.ok ? testSend : !account.ok ? account : null;
    const verdict = !failing
      ? "Brevo antwoordt correct. Komt de mail toch niet aan, controleer dan het afzenderdomein (DNS/SPF/DKIM) en de bounces in Brevo."
      : failing.status === 401
        ? "Brevo weigert de sleutel (401). De sleutel is ongeldig, ingetrokken of hoort bij een ander account."
        : failing.status === 403
          ? "Brevo weigert de toegang (403). Meestal is het afzenderadres niet geverifieerd of mist de sleutel de rechten voor transactionele mail."
          : failing.status === 400
            ? "Brevo weigert de payload (400) — zie de body hieronder, doorgaans een niet-geverifieerd afzenderadres."
            : failing.status === 0
              ? "De server kon Brevo niet bereiken (netwerk of uitgaande verbinding geblokkeerd)."
              : `Brevo antwoordde met status ${failing.status}. Zie de body hieronder.`;

    return { env, route, account, testSend, verdict };
  });
