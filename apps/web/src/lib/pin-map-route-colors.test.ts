import { describe, expect, it } from "vitest";

import {
  animatedRouteLineGradient,
  routeColorsEqual,
  staticRouteLineGradient,
} from "./pin-map-route-colors";

describe("staticRouteLineGradient", () => {
  it("builds a duotone gradient between two colors", () => {
    const gradient = staticRouteLineGradient("#ff0000", "#0000ff");
    expect(gradient[0]).toBe("interpolate");
    expect(gradient).toContain("rgba(255, 0, 0, 0.72)");
    expect(gradient).toContain("rgba(0, 0, 255, 0.72)");
  });

  it("builds a monotone gradient for matching colors", () => {
    const gradient = staticRouteLineGradient("#2d6a5d", "#2d6a5d");
    expect(gradient.length).toBeGreaterThan(6);
    expect(routeColorsEqual("#2d6a5d", "#2D6A5D")).toBe(true);
  });
});

describe("staticRouteLineGradient on dark basemaps", () => {
  it("lightens colors and uses higher alpha for duotone segments", () => {
    const gradient = staticRouteLineGradient("#ff0000", "#0000ff", {
      darkBasemap: true,
    });
    const light = staticRouteLineGradient("#ff0000", "#0000ff");
    expect(gradient).not.toEqual(light);
    expect(gradient.some((part) => String(part).includes(", 0.88)"))).toBe(
      true,
    );
  });
});

describe("animatedRouteLineGradient", () => {
  it("returns a line-progress expression", () => {
    const gradient = animatedRouteLineGradient("#ff0000", "#0000ff", 0.5);
    expect(gradient[2]).toEqual(["line-progress"]);
  });
});
