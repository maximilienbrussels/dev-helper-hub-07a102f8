import { createFileRoute } from "@tanstack/react-router";
import { lookupCertificate } from "@/lib/verify.server";

/**
 * Publiek, niet-geauthenticeerd endpoint voor echtheidscontrole van een
 * certificaat. Aanvaardt `?id=`, `?number=` of `?code=` (token of leesbare
 * code) en geeft enkel publieke gegevens terug.
 */
export const Route = createFileRoute("/api/public/verify-certificate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const value =
          url.searchParams.get("id") ??
          url.searchParams.get("number") ??
          url.searchParams.get("code") ??
          "";

        let result: Awaited<ReturnType<typeof lookupCertificate>> = {
          valid: false,
          reason: "invalid_format",
        };
        try {
          result = await lookupCertificate(value);
        } catch {
          result = { valid: false, reason: "not_found" };
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=60",
          },
        });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),
    },
  },
});
