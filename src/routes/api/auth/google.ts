import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/auth/google
 *
 * Start de Google-aanmelding: we bewaren een willekeurige `state` in een
 * HttpOnly-cookie en sturen de bezoeker door naar het toestemmingsscherm van
 * Google. De client secret blijft altijd op de server.
 */
export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const {
          googleCredentials,
          redirectUri,
          siteOrigin,
          cookieHeader,
          OAUTH_STATE_COOKIE,
          GOOGLE_AUTH_ENDPOINT,
          GOOGLE_LOGIN_SCOPES,
          GOOGLE_CALENDAR_SCOPES,
        } = await import("@/lib/google-oauth.server");

        const { logAuthConfig, loginErrorUrl } = await import("@/lib/auth-config");
        const creds = googleCredentials();
        const origin = siteOrigin(request);
        logAuthConfig(origin, "google");
        if (!creds) {
          console.error("[OAuth Failure]", {
            provider: "google",
            reason: "google-niet-geconfigureerd",
            origin,
          });
          return Response.redirect(
            loginErrorUrl(origin, request, "google-niet-geconfigureerd", "google"),
            302,
          );
        }

        const params = new URL(request.url).searchParams;
        const requested = params.get("next");
        const next = requested && isSafePath(requested) ? requested : "";
        // Alleen wanneer een teamlid uitdrukkelijk de agenda wil koppelen
        // vragen we agenda-toestemming. Aanmelden doet dat nooit.
        const wantsCalendar = params.get("calendar") === "1";
        const nonce = crypto.randomUUID().replace(/-/g, "");
        const base = next ? `${nonce}.${btoa(next)}` : nonce;
        // `link=1`: koppelen aan het al aangemelde account i.p.v. inloggen.
        const state = params.get("link") === "1" ? `${base}.L` : base;

        const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
        authUrl.searchParams.set("client_id", creds.clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri(request));
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", wantsCalendar ? GOOGLE_CALENDAR_SCOPES : GOOGLE_LOGIN_SCOPES);
        authUrl.searchParams.set("state", state);
        if (wantsCalendar) {
          // Offline + consent: alleen zo geeft Google een refresh_token terug,
          // dat we nodig hebben om de agenda te blijven synchroniseren.
          authUrl.searchParams.set("prompt", "consent");
          authUrl.searchParams.set("access_type", "offline");
          authUrl.searchParams.set("include_granted_scopes", "true");
        } else {
          // Gewone aanmelding: enkel accountkeuze, geen extra toestemmingen.
          authUrl.searchParams.set("prompt", "select_account");
          authUrl.searchParams.set("access_type", "online");
        }

        return new Response(null, {
          status: 302,
          headers: {
            Location: authUrl.toString(),
            "Set-Cookie": cookieHeader(OAUTH_STATE_COOKIE, state, {
              maxAge: 600,
              secure: origin.startsWith("https://"),
            }),
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});

/** Enkel paden binnen deze site (geen //andere-site of /\\andere-site). */
const isSafePath = (x: string) => x.startsWith("/") && !x.startsWith("//") && !x.startsWith("/\\");
