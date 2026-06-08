import { describe, expect, it } from "vitest";
import {
  coordsFromMapShareUrl,
  extractLocationFromMapShareUrl,
  extractTitleFromMapShareUrl,
  isMapShareUrl,
  normalizeMapPlaceKey,
} from "./map-url.ts";

describe("normalizeMapPlaceKey", () => {
  it("prefers place CID from data URL", () => {
    const url =
      "https://www.google.com/maps/place/Wrigley+Field/data=!4m2!3m1!1s0x880fd3b2e59adf21:0x1cea3ee176ddd646";
    expect(normalizeMapPlaceKey(url)).toBe(
      "cid:0x880fd3b2e59adf21:0x1cea3ee176ddd646",
    );
  });
});

describe("extractTitleFromMapShareUrl", () => {
  it("reads place name from path", () => {
    expect(
      extractTitleFromMapShareUrl(
        "https://www.google.com/maps/place/Cafe+Central/@41.9,-87.6,17z",
      ),
    ).toBe("Cafe Central");
  });
});

describe("coordsFromMapShareUrl", () => {
  it("reads embedded !3d!4d coordinates", () => {
    const coords = coordsFromMapShareUrl(
      "https://www.google.com/maps/place/Cafe/@41.9,-87.6,17z/data=!3d41.901!4d-87.601",
    );
    expect(coords).toEqual({ lat: 41.901, lng: -87.601 });
  });
});

describe("isMapShareUrl", () => {
  it("recognizes maps.google.com URLs", () => {
    expect(isMapShareUrl("https://maps.google.com/?q=cafe")).toBe(true);
  });
});

describe("extractLocationFromMapShareUrl", () => {
  it("returns coords and label when present", () => {
    const loc = extractLocationFromMapShareUrl(
      "https://www.google.com/maps/place/Cafe/@41.9,-87.6,17z/data=!3d41.901!4d-87.601",
    );
    expect(loc?.lat).toBe(41.901);
    expect(loc?.lng).toBe(-87.601);
  });
});
