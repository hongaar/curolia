import {
  mapPanelPinHash,
  parseMapPanelPinHash,
  withUrlHash,
} from "@/lib/map-panel-pin-hash";
import { describe, expect, it } from "vitest";

describe("mapPanelPinHash", () => {
  it("encodes a pin slug as a URL fragment", () => {
    expect(mapPanelPinHash("e2e-target-pin")).toBe("#e2e-target-pin");
  });
});

describe("parseMapPanelPinHash", () => {
  it("reads slugs and UUIDs", () => {
    expect(parseMapPanelPinHash("#e2e-target-pin")).toBe("e2e-target-pin");
    expect(parseMapPanelPinHash("E2E-Target-Pin")).toBe("e2e-target-pin");
    expect(parseMapPanelPinHash("#00000000-0000-4000-a000-000000000003")).toBe(
      "00000000-0000-4000-a000-000000000003",
    );
  });

  it("rejects empty or unrelated fragments", () => {
    expect(parseMapPanelPinHash("")).toBeNull();
    expect(parseMapPanelPinHash("#")).toBeNull();
    expect(parseMapPanelPinHash("#not a slug")).toBeNull();
  });
});

describe("withUrlHash", () => {
  it("appends a normalized pin hash", () => {
    expect(withUrlHash("/joram/trip/blog", "#e2e-target-pin")).toBe(
      "/joram/trip/blog#e2e-target-pin",
    );
    expect(withUrlHash("/joram/trip/gallery?tags=a", "e2e-target-pin")).toBe(
      "/joram/trip/gallery?tags=a#e2e-target-pin",
    );
  });

  it("leaves the href unchanged without a pin fragment", () => {
    expect(withUrlHash("/joram/trip/blog", "")).toBe("/joram/trip/blog");
    expect(withUrlHash("/joram/trip/blog", "#not a slug")).toBe(
      "/joram/trip/blog",
    );
  });
});
