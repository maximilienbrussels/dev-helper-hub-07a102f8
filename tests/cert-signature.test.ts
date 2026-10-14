import { describe, expect, it, beforeAll } from "vitest";
import { signCertCode, verifyCertSignature } from "@/lib/academy-sig.server";
import { parseScanned } from "@/routes/verifieer.$code";

beforeAll(() => {
  process.env["CERT_QR_SECRET"] = "test-secret-voor-certificaten-1234";
});

describe("certificaat-handtekening", () => {
  it("valideert enkel de eigen code", async () => {
    const sig = await signCertCode("KNJ-2026-0001");
    expect(await verifyCertSignature("KNJ-2026-0001", sig)).toBe(true);
    expect(await verifyCertSignature("knj-2026-0001", sig)).toBe(true);
    expect(await verifyCertSignature("KNJ-2026-0002", sig)).toBe(false);
  });

  it("weigert geknoeide of ontbrekende handtekeningen", async () => {
    const sig = await signCertCode("KIP-2026-0007");
    const tampered = `${sig.slice(0, -1)}${sig.endsWith("a") ? "b" : "a"}`;
    expect(await verifyCertSignature("KIP-2026-0007", tampered)).toBe(false);
    expect(await verifyCertSignature("KIP-2026-0007", undefined)).toBe(false);
    expect(await verifyCertSignature("KIP-2026-0007", "")).toBe(false);
    expect(await verifyCertSignature("KIP-2026-0007", "zz")).toBe(false);
  });
});

describe("gescande QR-inhoud", () => {
  it("leest code en handtekening uit een verificatielink", () => {
    expect(parseScanned("https://maximilien.brussels/verifieer/KNJ-2026-0001?s=abc")).toEqual({
      code: "KNJ-2026-0001",
      sig: "abc",
    });
  });

  it("aanvaardt een los certificaatnummer", () => {
    expect(parseScanned(" #KNJ-2026-0001 ")).toEqual({ code: "KNJ-2026-0001", sig: undefined });
  });

  it("weigert onzin", () => {
    expect(parseScanned("abc")).toBeNull();
    expect(parseScanned("")).toBeNull();
  });
});
