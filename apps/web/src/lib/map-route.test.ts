import {
  isPublicMapViewPathname,
  parseMapRoutePathname,
  parsePinRoutePathname,
} from "@/lib/map-route";
import { describe, expect, it } from "vitest";

describe("isPublicMapViewPathname", () => {
  it("allows public map and blog views", () => {
    expect(isPublicMapViewPathname("/joram/trip/map")).toBe(true);
    expect(isPublicMapViewPathname("/joram/trip/blog")).toBe(true);
  });

  it("allows pin detail but not pin edit", () => {
    expect(isPublicMapViewPathname("/joram/trip/pin/cafe")).toBe(true);
    expect(isPublicMapViewPathname("/joram/trip/pin/cafe/edit")).toBe(false);
  });

  it("blocks account, settings, and legacy-style paths", () => {
    expect(isPublicMapViewPathname("/joram/trip/settings")).toBe(false);
    expect(isPublicMapViewPathname("/profile")).toBe(false);
    expect(isPublicMapViewPathname("/map/trip")).toBe(false);
    expect(isPublicMapViewPathname("/pins/trip/cafe")).toBe(false);
  });
});

describe("parseMapRoutePathname", () => {
  it("extracts slugs from map and pin routes", () => {
    expect(parseMapRoutePathname("/joram/trip/map")).toEqual({
      profileSlug: "joram",
      mapSlug: "trip",
    });
    expect(parseMapRoutePathname("/joram/trip/pin/cafe")).toEqual({
      profileSlug: "joram",
      mapSlug: "trip",
    });
    expect(parsePinRoutePathname("/joram/trip/pin/cafe")).toEqual({
      profileSlug: "joram",
      mapSlug: "trip",
      pinSlug: "cafe",
    });
  });
});
