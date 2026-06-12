import { resolvePublicMapShortcutRedirect } from "@/lib/app-paths";
import {
  isPublicMapViewPathname,
  parseMapRoutePathname,
  parsePinRoutePathname,
  parsePublicMapShortcutPathname,
} from "@/lib/map-route";
import { describe, expect, it } from "vitest";

describe("isPublicMapViewPathname", () => {
  it("allows public map and blog views", () => {
    expect(isPublicMapViewPathname("/joram/trip/map")).toBe(true);
    expect(isPublicMapViewPathname("/joram/trip/blog")).toBe(true);
    expect(isPublicMapViewPathname("/joram/trip")).toBe(true);
  });

  it("allows pin detail but not pin edit", () => {
    expect(isPublicMapViewPathname("/joram/trip/pin/cafe")).toBe(true);
    expect(isPublicMapViewPathname("/joram/trip/pin/cafe/edit")).toBe(false);
  });

  it("blocks account, settings, and legacy-style paths", () => {
    expect(isPublicMapViewPathname("/joram/trip/settings")).toBe(false);
    expect(isPublicMapViewPathname("/profile")).toBe(false);
    expect(isPublicMapViewPathname("/settings/plugins")).toBe(false);
    expect(isPublicMapViewPathname("/map/trip")).toBe(false);
    expect(isPublicMapViewPathname("/pins/trip/cafe")).toBe(false);
    expect(isPublicMapViewPathname("/for/geocaching")).toBe(false);
  });
});

describe("parsePublicMapShortcutPathname", () => {
  it("parses bare public map links", () => {
    expect(
      parsePublicMapShortcutPathname("/hongaar/lekker-zonder-wekker"),
    ).toEqual({
      profileSlug: "hongaar",
      mapSlug: "lekker-zonder-wekker",
    });
    expect(
      parsePublicMapShortcutPathname("/hongaar/lekker-zonder-wekker/"),
    ).toEqual({
      profileSlug: "hongaar",
      mapSlug: "lekker-zonder-wekker",
    });
  });

  it("ignores app and nested map routes", () => {
    expect(parsePublicMapShortcutPathname("/joram/trip/map")).toBeNull();
    expect(parsePublicMapShortcutPathname("/settings/plugins")).toBeNull();
    expect(parsePublicMapShortcutPathname("/joram/trip/pin/cafe")).toBeNull();
  });

  it("ignores campaign landing pages", () => {
    expect(parsePublicMapShortcutPathname("/for/geocaching")).toBeNull();
    expect(parsePublicMapShortcutPathname("/for/travel/")).toBeNull();
  });
});

describe("resolvePublicMapShortcutRedirect", () => {
  it("redirects shortcuts to the map view", () => {
    expect(
      resolvePublicMapShortcutRedirect("/hongaar/lekker-zonder-wekker"),
    ).toBe("/hongaar/lekker-zonder-wekker/map");
    expect(resolvePublicMapShortcutRedirect("/joram/trip/map")).toBeNull();
  });

  it("does not redirect campaign landing pages", () => {
    expect(resolvePublicMapShortcutRedirect("/for/geocaching")).toBeNull();
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
