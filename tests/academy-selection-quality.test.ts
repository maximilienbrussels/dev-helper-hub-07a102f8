import { describe, expect, it } from "vitest";
import { controleerPool } from "../src/lib/academy-selectie";

describe("Academy publicatiekwaliteit", () => {
  it("vereist een kids-pool en vijf 16+-vragen per ronde", () => {
    const questions = [
      ...Array.from({ length: 8 }, (_, i) => ({ id: `k${i}`, doelgroep: "kids", module: 1 })),
      ...[1, 2, 3].flatMap((module) =>
        Array.from({ length: 5 }, (_, i) => ({ id: `a${module}-${i}`, doelgroep: "16plus", module })),
      ),
    ];
    expect(controleerPool(questions).publiceerbaar).toBe(true);
    expect(controleerPool(questions.slice(0, -1)).publiceerbaar).toBe(false);
  });
});