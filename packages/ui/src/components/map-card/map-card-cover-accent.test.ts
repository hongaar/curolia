import { describe, expect, it } from "vitest";

import {
  averageOpaqueRgb,
  rgbToAccentCss,
  rgbToHsl,
} from "./map-card-cover-accent";

describe("averageOpaqueRgb", () => {
  it("averages opaque pixels and skips transparent ones", () => {
    const data = new Uint8ClampedArray([
      200, 40, 40, 255, 100, 100, 100, 0, 0, 80, 200, 255,
    ]);

    expect(averageOpaqueRgb(data)).toEqual({ r: 100, g: 60, b: 120 });
  });
});

describe("rgbToHsl", () => {
  it("detects low saturation for neutrals", () => {
    const [, saturation] = rgbToHsl(128, 128, 128);
    expect(saturation).toBeLessThan(0.01);
  });

  it("detects hue for saturated colors", () => {
    const [hue, saturation] = rgbToHsl(40, 80, 220);
    expect(saturation).toBeGreaterThan(0.4);
    expect(hue).toBeGreaterThan(200);
    expect(hue).toBeLessThan(260);
  });
});

describe("rgbToAccentCss", () => {
  it("returns muted oklch for near-gray samples", () => {
    expect(rgbToAccentCss(128, 130, 132)).toMatch(/^oklch\(/);
  });

  it("boosts saturation for colorful samples", () => {
    expect(rgbToAccentCss(220, 40, 40)).toMatch(/^hsl\(/);
  });
});
