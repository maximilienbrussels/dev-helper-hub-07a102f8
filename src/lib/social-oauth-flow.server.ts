/**
 * Gedeelde OAuth-flow (server-only): state-cookie zetten bij het starten en
 * bij de callback de gebruiker bijwerken, de sessie-JWT ondertekenen en
 * doorsturen naar `/account` of het beheerdersportaal.
 */
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  cookieHeader,
  landingPathForRole,
  readCookie,
  resolveRole,
  siteOrigin,
} from "./google-oauth.server";
import { logAuthConfig, loginErrorUrl } from "./auth-config";
import { upsertSocialUser, type SocialProfile, type SocialProvider } from "./social-oauth.server";

export function buildState(request: Request): string {
  const params = new URL(request.url).searchParams;
  const requested = params.get("next");
  const next = requested && isSafePath(requested) ? requested : "";
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const base = next ? `${nonce}.${btoa(next)}` : nonce;
  // Koppelmodus: de bezoeker is al aangemeld en wil deze aanbieder aan zijn
  // bestaande account hangen (geen nieuwe login, geen tweede account).
  return params.get("link") === "1" ? `${base}.L` : base;
}

/** Vraagt de state om koppelen in plaats van aanmelden? */
export function isLinkState(state: string | null | undefined): boolean {
  return Boolean(state && state.endsWith(".L"));
}

export function startRedirect(request: Request, authUrl: URL, state: string): Response {
  const origin = siteOrigin(request);
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
}

export function oauthFailure(
  request: Request,
  reason: string,
  provider?: SocialProvider,
  error?: unknown,
): Response {
  const origin = siteOrigin(request);
  console.error("[OAuth Failure]", {
    provider: provider ?? "onbekend",
    reason,
    origin,
    url: new URL(request.url).pathname,
    message: error instanceof Error ? error.message : error ? String(error) : undefined,
    stack: error instanceof Error ? error.stack : undefined,
  });
  logAuthConfig(origin, provider === "github" ? "github" : undefined);
  return new Response(null, {
    status: 302,
    headers: {
      Location: loginErrorUrl(origin, request, reason, provider),
      "Cache-Control": "no-store",
    },
  });
}

/** Valideert de state en levert de code terug, of een foutredirect. */
export function verifyCallback(
  request: Request,
  provider: SocialProvider,
): { code: string; next: string; link: boolean } | Response {
  const params = new URL(request.url).searchParams;
  if (params.get("error")) return oauthFailure(request, `${provider}-geweigerd`, provider);
  const code = params.get("code");
  const state = params.get("state");
  const stateCookie = readCookie(request, OAUTH_STATE_COOKIE);
  if (!code) return oauthFailure(request, `${provider}-zonder-code`, provider);
  if (!state || !stateCookie || state !== stateCookie) {
    return oauthFailure(request, `${provider}-state`, provider);
  }
  let next = "";
  const encoded = state.split(".")[1];
  if (encoded) {
    try {
      const decoded = atob(encoded);
      if (isSafePath(decoded)) next = decoded;
    } catch {
      /* ongeldige state-payload: negeren */
    }
  }
  return { code, next, link: isLinkState(state) };
}

/**
 * Koppelt de aanbieder aan het account van de al aangemelde bezoeker.
 * De sessiecookie bepaalt wie dat is; er wordt nooit van account gewisseld.
 */
export async function completeIdentityLink(
  request: Request,
  provider: SocialProvider,
  profile: SocialProfile,
  next: string,
): Promise<Response> {
  const origin = siteOrigin(request);
  const landing = next && isSafePath(next) ? next : "/account";
  const secure = origin.startsWith("https://");

  const finish = (query: string) => {
    const headers = new Headers({
      Location: new URL(`${landing}${landing.includes("?") ? "&" : "?"}${query}`, origin).toString(),
      "Cache-Control": "no-store",
    });
    headers.append("Set-Cookie", cookieHeader(OAUTH_STATE_COOKIE, "", { maxAge: 0, secure }));
    return new Response(null, { status: 302, headers });
  };

  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return finish(`linkerror=${provider}:sessie`);

  let userId: string;
  try {
    const auth = await import("./local-auth.server");
    const claims = (await auth.verifySession(token)) as { sub?: string };
    if (!claims?.sub) throw new Error("geen sub");
    userId = String(claims.sub);
  } catch {
    return finish(`linkerror=${provider}:sessie`);
  }

  try {
    const { findUserIdByIdentity, recordIdentity } = await import("./identities.server");
    const owner = await findUserIdByIdentity(provider, profile.subject);
    if (owner && owner !== userId) return finish(`linkerror=${provider}:inuse`);
    await recordIdentity(
      userId,
      provider,
      profile.instance ?? null,
      profile.subject ?? null,
      profile.email ?? null,
    );
  } catch (error) {
    console.error("[oauth-link] koppelen mislukt:", provider, error);
    return finish(`linkerror=${provider}:mislukt`);
  }

  return finish(`linked=${provider}`);
}

/** Werkt de gebruiker bij, zet de sessiecookie en stuurt door. */
export async function completeSocialLogin(
  request: Request,
  provider: SocialProvider,
  profile: SocialProfile,
  next: string,
): Promise<Response> {
  const { user, role } = await upsertSocialUser(profile, provider);
  return issueSessionRedirect(request, user, role, next, OAUTH_STATE_COOKIE);
}

/** Ondertekent de sessie, zet de cookie en stuurt door (gedeeld door alle aanbieders). */
export async function issueSessionRedirect(
  request: Request,
  user: import("./local-auth.server").AppUser,
  role: string,
  next: string,
  clearCookie: string,
): Promise<Response> {
  const origin = siteOrigin(request);
  const effectiveRole = await resolveRole(user.email, role);

  const auth = await import("./local-auth.server");
  const sessionToken = await auth.signSession(user);
  const handoff = await auth.mintToken({
    kind: "magic",
    email: user.email,
    ttlSeconds: 300,
    userId: user.id,
  });

  const landing = next || landingPathForRole(effectiveRole, origin);
  const destination = handoff
    ? new URL(
        `/inloglink?token=${encodeURIComponent(handoff)}&next=${encodeURIComponent(landing)}`,
        origin,
      )
    : new URL(landing, origin);

  const secure = origin.startsWith("https://");
  const headers = new Headers({ Location: destination.toString(), "Cache-Control": "no-store" });
  headers.append(
    "Set-Cookie",
    cookieHeader(SESSION_COOKIE, sessionToken, { maxAge: 30 * 24 * 3600, secure }),
  );
  headers.append("Set-Cookie", cookieHeader(clearCookie, "", { maxAge: 0, secure }));
  return new Response(null, { status: 302, headers });
}

/** Enkel paden binnen deze site (geen //andere-site of /\\andere-site). */
const isSafePath = (x: string) => x.startsWith("/") && !x.startsWith("//") && !x.startsWith("/\\");
