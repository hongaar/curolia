import { describe, expect, it } from "vitest";
import { buildDirectionsUrl } from "./navigation-url";

describe("buildDirectionsUrl", () => {
  const lat = 48.8584;
  const lng = 2.2945;

  it("builds Google Maps directions URL", () => {
    expect(buildDirectionsUrl("google_maps", lat, lng)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=48.8584%2C2.2945",
    );
  });

  it("builds Apple Maps directions URL", () => {
    expect(buildDirectionsUrl("apple_maps", lat, lng)).toBe(
      "https://maps.apple.com/?daddr=48.8584%2C2.2945&dirflg=d",
    );
  });

  it("builds Waze directions URL", () => {
    expect(buildDirectionsUrl("waze", lat, lng)).toBe(
      "https://www.waze.com/ul?ll=48.8584,2.2945&navigate=yes",
    );
  });

  it("builds Citymapper directions URL", () => {
    expect(buildDirectionsUrl("citymapper", lat, lng)).toBe(
      "https://citymapper.com/directions?endcoord=48.8584,2.2945",
    );
  });

  it("builds HERE WeGo directions URL", () => {
    expect(buildDirectionsUrl("here_wego", lat, lng)).toBe(
      "https://wego.here.com/directions/mix//:48.8584,2.2945",
    );
  });
});
