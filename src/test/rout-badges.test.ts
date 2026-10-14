import { describe, it, expect } from "vitest";
import { classifyBadgeStatus, backoffMs } from "@/lib/rout-shared";

describe("ROUT badge response handling", () => {
  it("201 is created", () => expect(classifyBadgeStatus(201)).toBe("created"));
  it("404 is handle not found", () => expect(classifyBadgeStatus(404)).toBe("not_found"));
  it("401 and 403 are auth alerts", () => {
    expect(classifyBadgeStatus(401)).toBe("auth");
    expect(classifyBadgeStatus(403)).toBe("auth");
  });
  it("429 and 5xx are retried", () => {
    expect(classifyBadgeStatus(429)).toBe("retry");
    expect(classifyBadgeStatus(503)).toBe("retry");
  });
  it("400 is not retried", () => expect(classifyBadgeStatus(400)).toBe("fail"));
  it("backoff doubles per attempt", () => {
    expect([1, 2, 3, 4].map((n) => backoffMs(n))).toEqual([500, 1000, 2000, 4000]);
  });
});
