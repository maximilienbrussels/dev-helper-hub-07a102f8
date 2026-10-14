import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/auth/providers
 *
 * Publieke, secret-vrije statuslijst van de sociale inlogmethodes. De
 * inlogpagina toont enkel knoppen voor providers die effectief geconfigureerd
 * zijn, zodat bezoekers nooit op een foutmelding botsen. De callback-URL's zijn
 * publieke informatie (ze staan ook in de developer console van de provider) en
 * helpen beheerders bij het instellen.
 */
export const Route = createFileRoute("/api/auth/providers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authOrigin } = await import("@/lib/google-oauth.server");
        const { hasDatabase } = await import("@/lib/neon.server");
        // Publieke info: exact de callback-URL die bij de aanbieder hoort.
        const origin = authOrigin(request);

        const env = (name: string) => Boolean(process.env[name]);
        const db = hasDatabase();

        const providers = [
          {
            id: "google" as const,
            configured: db && env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET"),
            missing: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].filter((n) => !env(n)),
            startPath: "/api/auth/login/google",
            callbackUrl: `${origin}/api/auth/callback/google`,
          },
          {
            id: "github" as const,
            configured: db && env("GITHUB_CLIENT_ID") && env("GITHUB_CLIENT_SECRET"),
            missing: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"].filter((n) => !env(n)),
            startPath: "/api/auth/login/github",
            callbackUrl: `${origin}/api/auth/callback/github`,
          },
          {
            // Mastodon registreert zijn app dynamisch: enkel een database nodig.
            id: "mastodon" as const,
            configured: db,
            missing: db ? [] : ["DATABASE_URL"],
            startPath: "/api/auth/login/mastodon",
            callbackUrl: `${origin}/api/auth/callback/mastodon`,
          },
          {
            // Bluesky (AT Protocol) werkt met een publiek client-metadata
            // document: geen client secret, enkel een database nodig.
            id: "bluesky" as const,
            configured: db,
            missing: db ? [] : ["DATABASE_URL"],
            startPath: "/api/auth/login/bluesky",
            callbackUrl: `${origin}/api/auth/callback/bluesky`,
          },
          {
            // ROUT (OpenID Connect): vaste client_id, secret enkel op de server.
            id: "rout" as const,
            configured: db && env("ROUT_CLIENT_SECRET"),
            missing: ["ROUT_CLIENT_SECRET"].filter((n) => !env(n)),
            startPath: "/api/auth/login/rout",
            callbackUrl: process.env["ROUT_REDIRECT_URI"] ?? `${origin}/auth/callback/rout`,
          },
        ];

        return new Response(
          JSON.stringify({ origin, database: db, providers }),
          {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});
