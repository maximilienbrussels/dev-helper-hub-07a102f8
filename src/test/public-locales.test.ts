import { describe, expect, it } from "vitest";
import { EXTRA_LANGS, deepTx } from "@/lib/i18n-extra";

describe("supplemental locale release safety", () => {
  it.each(["de", "ar", "tr", "es", "it", "pt", "pl", "ro", "zgh"])(
    "%s remains unreleased while static and Academy coverage is incomplete",
    (code) => {
      const locale = EXTRA_LANGS.find((entry) => entry.code === code);
      expect(locale).toBeDefined();
      expect(locale?.ready).toBe(false);
    },
  );
  it("preserves identifiers, numbers and callable interpolators while mapping nested data", () => {
    const interpolate = (n: number) => `Group ${n}`;
    const input = { count: 26, enabled: false, optional: null, items: ["source"], interpolate };
    const mapped = deepTx((value) => `mapped:${value}`, input);
    expect(mapped.count).toBe(26);
    expect(mapped.enabled).toBe(false);
    expect(mapped.optional).toBeNull();
    expect(mapped.interpolate).toBe(interpolate);
    expect(mapped.items).toHaveLength(1);
    expect(input.items).not.toBe(mapped.items);
  });
});