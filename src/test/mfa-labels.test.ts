import { describe, expect, it } from "vitest";
import { recoveryCodesText, totpIssuer, totpUri } from "@/lib/mfa-labels";

describe("mfa labels", () => {
  it("staff get the Beheer issuer", () => expect(totpIssuer(true)).toBe("Maximilien Beheer"));
  it("visitors get the plain issuer", () => expect(totpIssuer(false)).toBe("Maximilien"));
  it("uri carries the given email", () =>
    expect(totpUri("ABC", "desk@delplanche.com", true)).toContain(encodeURIComponent("Maximilien Beheer:desk@delplanche.com")));
  it("recovery file lists account and all codes", () => {
    const t = recoveryCodesText("a@b.be", ["AAAA-1111", "BBBB-2222"], new Date("2026-01-01T10:00:00Z"));
    expect(t).toContain("Account: a@b.be");
    expect(t).toContain("AAAA-1111");
    expect(t).toContain("BBBB-2222");
  });
});
