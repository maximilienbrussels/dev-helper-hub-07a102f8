import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/auth/callback/google
 *
 * Google stuurt de bezoeker hier terug. We wisselen de code in voor het
 * profiel, werken `public.app_users` bij (aanmaken of `last_login_at`),
 * ondertekenen een sessie-JWT, zetten de HttpOnly-cookie en sturen door naar
 * `/account` of het beheerdersportaal.
 */
export const Route = createFileRoute("/api/auth/callback/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const mod = await import("@/lib/google-oauth.server");
        const { logAuthConfig, loginErrorUrl } = await import("@/lib/auth-config");
        const origin = mod.siteOrigin(request);
        logAuthConfig(origin, "google");
        const fail = (reason: string, error?: unknown) => {
          console.error("[OAuth Failure]", {
            provider: "google",
            reason,
            origin,
            url: new URL(request.url).pathname,
            message: error instanceof Error ? error.message : error ? String(error) : undefined,
            stack: error instanceof Error ? error.stack : undefined,
          });
          return new Response(null, {
            status: 302,
            headers: {
              Location: loginErrorUrl(origin, request, reason, "google"),
              "Cache-Control": "no-store",
            },
          });
        };

        const params = new URL(request.url).searchParams;
        if (params.get("error")) return fail("google-geweigerd");

        const code = params.get("code");
        const state = params.get("state");
        const stateCookie = mod.readCookie(request, mod.OAUTH_STATE_COOKIE);
        if (!code) return fail("google-zonder-code");
        if (!state || !stateCookie || state !== stateCookie) return fail("google-state");

        let next = "";
        const encoded = state.split(".")[1];
        if (encoded) {
          try {
            const decoded = atob(encoded);
            if (isSafePath(decoded)) next = decoded;
          } catch {
            /* ongeldige state-payload: gewoon negeren */
          }
        }

        try {
          const profile = await mod.exchangeCodeForProfile(code, request);

          const flow = await import("@/lib/social-oauth-flow.server");
          if (flow.isLinkState(state)) {
            return await flow.completeIdentityLink(
              request,
              "google",
              {
                email: profile.email,
                name: profile.name ?? null,
                picture: profile.picture ?? null,
                emailVerified: true,
                subject: profile.subject ?? null,
              },
              next,
            );
          }

          const { user, role } = await mod.upsertGoogleUser(profile);
          const effectiveRole = await mod.resolveRole(user.email, role);

          // Alleen wanneer de gebruiker uitdrukkelijk agenda-toegang gaf bewaren
          // we (versleutelde) tokens. Bij gewoon aanmelden bewaren we niets.
          if (profile.tokens.scope?.includes("auth/calendar")) {
            const sync = await import("@/lib/google-sync.server");
            await sync.saveGoogleTokens(user.id, profile.tokens).catch((error: unknown) => {
              console.error("[google-oauth] tokens bewaren mislukt:", error);
            });
          }

          const auth = await import("@/lib/local-auth.server");
          const sessionToken = await auth.signSession(user);

          // Eenmalige token zodat de browser dezelfde sessie ook lokaal
          // bewaart (de app stuurt hem als bearer mee met serverfuncties).
          const handoff = await auth.mintToken({
            kind: "magic",
            email: user.email,
            ttlSeconds: 300,
            userId: user.id,
          });

          const landing = next || mod.landingPathForRole(effectiveRole, origin);
          const destination = handoff
            ? new URL(
                `/inloglink?token=${encodeURIComponent(handoff)}&next=${encodeURIComponent(landing)}`,
                origin,
              )
            : new URL(landing, origin);

          const secure = origin.startsWith("https://");
          const headers = new Headers({
            Location: destination.toString(),
            "Cache-Control": "no-store",
          });
          headers.append(
            "Set-Cookie",
            mod.cookieHeader(mod.SESSION_COOKIE, sessionToken, {
              maxAge: 30 * 24 * 3600,
              secure,
            }),
          );
          headers.append(
            "Set-Cookie",
            mod.cookieHeader(mod.OAUTH_STATE_COOKIE, "", { maxAge: 0, secure }),
          );
          return new Response(null, { status: 302, headers });
        } catch (error) {
          return fail("google-mislukt", error);
        }
      },
    },
  },
});

/** Enkel paden binnen deze site (geen //andere-site of /\\andere-site). */
const isSafePath = (x: string) => x.startsWith("/") && !x.startsWith("//") && !x.startsWith("/\\");
