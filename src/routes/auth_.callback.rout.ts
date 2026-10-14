import { createFileRoute } from "@tanstack/react-router";

/** GET /auth/callback/rout — controleert state, wisselt de code in op de server en zet de sessie. */
export const Route = createFileRoute("/auth_/callback/rout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const rout = await import("@/lib/rout-oidc.server");
        const flow = await import("@/lib/social-oauth-flow.server");
        const { siteOrigin, cookieHeader } = await import("@/lib/google-oauth.server");
        const params = new URL(request.url).searchParams;
        const attempt = rout.readAttempt(request);
        const origin = siteOrigin(request);
        const secure = origin.startsWith("https://");

        const error = params.get("error");
        if (error) {
          // Stil aanmelden mislukt: gewoon terug, de knop blijft beschikbaar.
          if (attempt?.silent && rout.mapRoutError(error) === "rout-login-nodig") {
            const back = new URL(attempt.next || "/login", origin);
            back.searchParams.set("rout", "login_required");
            const headers = new Headers({ Location: back.toString(), "Cache-Control": "no-store" });
            headers.append("Set-Cookie", cookieHeader(rout.ROUT_COOKIE, "", { maxAge: 0, secure }));
            return new Response(null, { status: 302, headers });
          }
          return flow.oauthFailure(request, rout.mapRoutError(error));
        }

        const code = params.get("code");
        const state = params.get("state");
        if (!code) return flow.oauthFailure(request, "rout-zonder-code");
        if (!attempt || !state || state !== attempt.state) {
          return flow.oauthFailure(request, "rout-state");
        }

        try {
          const claims = await rout.exchangeCode(request, code, attempt);
          if (attempt.link) {
            return await flow.completeIdentityLink(
              request,
              "rout",
              {
                email: claims.email ?? "",
                name: claims.name ?? null,
                picture: claims.picture ?? null,
                emailVerified: claims.email_verified === true,
                subject: claims.sub,
              },
              attempt.next,
            );
          }
          const result = await rout.upsertRoutUser(claims);
          if ("error" in result) return flow.oauthFailure(request, `rout-${result.error}`);
          return await flow.issueSessionRedirect(
            request,
            result.user,
            result.role,
            attempt.next,
            rout.ROUT_COOKIE,
          );
        } catch (err) {
          return flow.oauthFailure(request, "rout-mislukt", undefined, err);
        }
      },
    },
  },
});
