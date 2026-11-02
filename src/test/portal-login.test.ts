import { describe, expect, it, vi } from "vitest";
import { portalLoginDestination, singleFlight } from "@/lib/portal-login";
import type { PortalAccess } from "@/lib/portal-access.functions";

const access: PortalAccess = { allowed: true, email: null, role: "admin", permissions: [], fullAccess: true, mfa: null, reason: "ok" };

describe("portal login consistency", () => {
  it("does not redirect allowed emergency access into MFA setup", () => {
    expect(portalLoginDestination({ ...access, mfa: "setup" }, "/nl/vandaag")).toBe("/nl/vandaag");
  });
  it("requires MFA when access is not allowed", () => {
    expect(portalLoginDestination({ ...access, allowed: false, mfa: "verify" }, "/nl/vandaag")).toBe("/beveiliging?next=%2Fnl%2Fvandaag");
  });
  it("does not navigate a denied account into the portal", () => {
    expect(portalLoginDestination({ ...access, allowed: false }, "/nl/vandaag")).toBeNull();
  });
  it("shares concurrent access checks and allows a fresh retry after failure", async () => {
    const run = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(true);
    const check = singleFlight(run);
    const first = check();
    expect(check()).toBe(first);
    await expect(first).rejects.toThrow("offline");
    await expect(check()).resolves.toBe(true);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
import { allowAutoRedirect, LOGIN_REDIRECT_WINDOW_MS, resetAutoRedirectGuard } from "@/lib/portal-login";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("login redirect loop guard", () => {
  it("stops the 4th automatic redirect within the window", () => {
    const s = memoryStorage();
    expect(allowAutoRedirect(s, 1000)).toBe(true);
    expect(allowAutoRedirect(s, 2000)).toBe(true);
    expect(allowAutoRedirect(s, 3000)).toBe(true);
    expect(allowAutoRedirect(s, 4000)).toBe(false);
  });
  it("allows redirects again after the window passes", () => {
    const s = memoryStorage();
    for (const t of [0, 1, 2]) allowAutoRedirect(s, t);
    expect(allowAutoRedirect(s, LOGIN_REDIRECT_WINDOW_MS + 10)).toBe(true);
  });
  it("allows redirects again after an explicit reset", () => {
    const s = memoryStorage();
    for (const t of [0, 1, 2]) allowAutoRedirect(s, t);
    resetAutoRedirectGuard(s);
    expect(allowAutoRedirect(s, 3)).toBe(true);
  });
});
