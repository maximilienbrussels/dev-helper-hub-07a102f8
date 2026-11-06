import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/neon.server", () => ({ db: () => async () => [] }));

import { formatPickupSlot } from "@/lib/orders/pickup-desk.server";

describe("afhaalmoment", () => {
  it("zet een Date om naar tekst", () => {
    const out = formatPickupSlot(new Date("2026-03-07T09:00:00Z"));
    expect(typeof out).toBe("string");
    expect(out).toContain("2026");
    expect(out).toContain("10:00");
  });
  it("zet een ISO-tekst om", () => {
    expect(formatPickupSlot("2026-03-07T09:00:00+00")).toContain("10:00");
  });
  it("geeft null bij leeg", () => {
    expect(formatPickupSlot(null)).toBeNull();
  });
  it("behoudt vrije tekst", () => {
    expect(formatPickupSlot("Zaterdag ochtend")).toBe("Zaterdag ochtend");
  });
});
