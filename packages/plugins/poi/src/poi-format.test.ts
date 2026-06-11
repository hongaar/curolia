import { describe, expect, it } from "vitest";
import { isUsefulPoiCandidate } from "./poi-format";

describe("isUsefulPoiCandidate", () => {
  it("accepts shops, restaurants, campsites, and public services", () => {
    expect(isUsefulPoiCandidate({ shop: "supermarket" })).toBe(true);
    expect(isUsefulPoiCandidate({ amenity: "restaurant" })).toBe(true);
    expect(isUsefulPoiCandidate({ amenity: "fuel" })).toBe(true);
    expect(isUsefulPoiCandidate({ amenity: "library" })).toBe(true);
    expect(isUsefulPoiCandidate({ tourism: "museum" })).toBe(true);
    expect(isUsefulPoiCandidate({ tourism: "camp_site" })).toBe(true);
    expect(isUsefulPoiCandidate({ tourism: "caravan_site" })).toBe(true);
  });

  it("rejects natural features, parks, and charging stations", () => {
    expect(isUsefulPoiCandidate({ natural: "dune" })).toBe(false);
    expect(isUsefulPoiCandidate({ natural: "water" })).toBe(false);
    expect(isUsefulPoiCandidate({ leisure: "park" })).toBe(false);
    expect(isUsefulPoiCandidate({ leisure: "nature_reserve" })).toBe(false);
    expect(isUsefulPoiCandidate({ boundary: "national_park" })).toBe(false);
    expect(isUsefulPoiCandidate({ amenity: "charging_station" })).toBe(false);
  });
});
