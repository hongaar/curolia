import { describe, expect, it } from "vitest";

import {
  deterministicEmojiAspectRatio,
  hashLayoutSeed,
  normalizeCoverAspectRatio,
} from "./map-card-layout";

describe("deterministicEmojiAspectRatio", () => {
  it("returns the same ratio for the same seed", () => {
    expect(deterministicEmojiAspectRatio("map-123")).toBe(
      deterministicEmojiAspectRatio("map-123"),
    );
  });

  it("can vary across different seeds", () => {
    const ratios = new Set([
      deterministicEmojiAspectRatio("alpha"),
      deterministicEmojiAspectRatio("beta"),
      deterministicEmojiAspectRatio("gamma"),
    ]);
    expect(ratios.size).toBeGreaterThan(1);
  });
});

describe("normalizeCoverAspectRatio", () => {
  it("clamps extreme image ratios", () => {
    expect(normalizeCoverAspectRatio(4000, 500)).toBe(1.55);
    expect(normalizeCoverAspectRatio(500, 4000)).toBe(0.62);
    expect(normalizeCoverAspectRatio(1600, 900)).toBe(1.55);
    expect(normalizeCoverAspectRatio(1200, 900)).toBeCloseTo(1.333, 2);
  });
});

describe("hashLayoutSeed", () => {
  it("is stable", () => {
    expect(hashLayoutSeed("seed")).toBe(hashLayoutSeed("seed"));
  });
});
