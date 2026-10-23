import { describe, expect, it, vi } from "vitest";
import { portalLoginDestination, singleFlight } from "@/lib/portal-login";
import type { PortalAccess } from "@/lib/portal-access.functions";

const access: PortalAccess = { allowed: true, email: null, role: "admin", permissions: [], fullAccess: true, mfa: null };

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