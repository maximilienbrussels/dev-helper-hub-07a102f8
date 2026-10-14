import { describe, expect, it } from "vitest";
import { backoffMs, classifyBadgeStatus, normalizeHandle, verifyRoutSignature } from "../src/lib/rout-shared";

async function sign(secret: string, t: number, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

describe("ROUT webhook-handtekening", () => {
  const body = JSON.stringify({ id: "evt_1", type: "user.handle.updated" });
  const now = 1_800_000_000;
  it("aanvaardt een geldige handtekening", async () => {
    const v1 = await sign("geheim", now, body);
    expect(await verifyRoutSignature("geheim", `t=${now},v1=${v1}`, body, now)).toEqual({ ok: true });
  });
  it("weigert een foute handtekening", async () => {
    const v1 = await sign("ander", now, body);
    expect((await verifyRoutSignature("geheim", `t=${now},v1=${v1}`, body, now)).ok).toBe(false);
  });
  it("weigert een oude tijdstempel", async () => {
    const t = now - 301;
    const v1 = await sign("geheim", t, body);
    expect(await verifyRoutSignature("geheim", `t=${t},v1=${v1}`, body, now)).toEqual({ ok: false, reason: "stale" });
  });
  it("weigert een ontbrekende header", async () => {
    expect((await verifyRoutSignature("geheim", null, body, now)).ok).toBe(false);
  });
});

describe("ROUT-hulpfuncties", () => {
  it("normaliseert handles", () => {
    expect(normalizeHandle("@Anna")).toBe("anna");
    expect(normalizeHandle("a b")).toBeNull();
  });
  it("classificeert badge-antwoorden", () => {
    expect(classifyBadgeStatus(201)).toBe("created");
    expect(classifyBadgeStatus(404)).toBe("not_found");
    expect(classifyBadgeStatus(403)).toBe("auth");
    expect(classifyBadgeStatus(429)).toBe("retry");
    expect(classifyBadgeStatus(503)).toBe("retry");
  });
  it("verdubbelt de wachttijd", () => {
    expect([1, 2, 3, 4, 5].map((n) => backoffMs(n))).toEqual([500, 1000, 2000, 4000, 8000]);
  });
});
