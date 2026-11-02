import { afterEach, describe, expect, it, vi } from "vitest";
import { landingPathForRole, oauthLandingPath } from "@/lib/google-oauth.server";

afterEach(() => vi.unstubAllEnvs());

describe("OAuth landing on the admin portal", () => {
  it("sends a user on maximilien.site to /nl/vandaag, never /account", () => {
    expect(landingPathForRole("user", "https://maximilien.site")).toBe("/nl/vandaag");
  });
  it("replaces a customer-only next path on maximilien.site with the portal", () => {
    expect(oauthLandingPath("/account", "super_admin", "https://maximilien.site")).toBe("/nl/vandaag");
  });
  it("keeps the security step as next on maximilien.site", () => {
    expect(oauthLandingPath("/beveiliging?next=%2Fnl%2Fvandaag", "super_admin", "https://maximilien.site"))
      .toBe("/beveiliging?next=%2Fnl%2Fvandaag");
  });
});
