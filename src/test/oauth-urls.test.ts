import { describe, expect, it, afterEach, vi } from "vitest";
import { PUBLIC_AUTH_ORIGIN, requestSiteOrigin, routCallbackUrl } from "@/lib/oauth-urls";
import { isInternalPath, safeRedirectPath } from "@/lib/redirect";
import { canonicalOrigins, langFromRequest, loginErrorUrl } from "@/lib/auth-config";

afterEach(() => vi.unstubAllEnvs());

describe("public domain and ROUT callback rules", () => {
  it("uses the user's public domain and exact ROUT callback path", () => {
    expect(PUBLIC_AUTH_ORIGIN).toBe("https://maximilien.brussels");
    expect(routCallbackUrl(PUBLIC_AUTH_ORIGIN)).toBe("https://maximilien.brussels/auth/callback/rout");
  });
  it("includes the public domain in OAuth diagnostics", () => {
    vi.stubEnv("OAUTH_ALLOWED_ORIGINS", "");
    vi.stubEnv("SITE_ORIGIN", "");
    expect(canonicalOrigins()).toContain("https://maximilien.brussels");
  });
  it("keeps preview callbacks with their own attempt cookie", () => {
    expect(routCallbackUrl("https://id-preview--example.lovable.app")).toBe("https://id-preview--example.lovable.app/auth/callback/rout");
  });
  it("accepts only a matching configured callback", () => {
    expect(routCallbackUrl(PUBLIC_AUTH_ORIGIN, " https://maximilien.brussels/auth/callback/rout ")).toBe("https://maximilien.brussels/auth/callback/rout");
    for (const url of ["https://maximilien.site/auth/callback/rout", "https://maximilien.brussels/api/auth/callback/rout", "https://maximilien.brussels/auth/callback/rout?x=1"]) {
      expect(() => routCallbackUrl(PUBLIC_AUTH_ORIGIN, url)).toThrow();
    }
  });
  it("reads the first proxy protocol without constructing an invalid URL", () => {
    const request = new Request("http://maximilien.brussels/api/auth/rout", { headers: { "x-forwarded-proto": "https, http" } });
    expect(requestSiteOrigin(request)).toBe("https://maximilien.brussels");
  });
  it("ignores malformed proxy hosts", () => {
    const request = new Request("http://localhost:8080/auth", { headers: { "x-forwarded-host": "evil.example/path" } });
    expect(requestSiteOrigin(request)).toBe("http://localhost:8080");
  });
  it("does not crash error redirects on malformed language cookies", () => {
    expect(langFromRequest(new Request(PUBLIC_AUTH_ORIGIN, { headers: { cookie: "ferme.lang=%ZZ" } }))).toBe("nl");
  });
});

describe("internal login return paths", () => {
  it("keeps failed Google login on the admin login page", () => {
    expect(new URL(loginErrorUrl("https://maximilien.site", new Request("https://maximilien.site/api/auth/google"), "google-niet-geconfigureerd", "google")).pathname).toBe("/auth");
  });
  it.each(["//evil.example", "/\\evil.example", "/\t/evil.example", "/\n/evil.example", "https://evil.example", "/path\\other"])("rejects unsafe return path %j", (path) => {
    expect(isInternalPath(path)).toBe(false);
    expect(safeRedirectPath(path)).toBe("/account");
  });
  it("preserves a legitimate localized return path and query", () => {
    expect(safeRedirectPath("/en/academy/rabbit?module=2")).toBe("/en/academy/rabbit?module=2");
  });
});