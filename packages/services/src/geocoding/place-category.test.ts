import { describe, expect, it } from "vitest";

import type { PinGeocode } from "./pin-geocode.ts";
import {
  enrichGeocodeFromSearchPlace,
  placeCategoryLabel,
  placeTitleZoomForCategory,
} from "./place-category.ts";

describe("placeCategoryLabel", () => {
  it("maps OSM place tags to readable labels", () => {
    expect(placeCategoryLabel({ osm_key: "place", osm_value: "city" })).toBe(
      "City",
    );
    expect(placeCategoryLabel({ osm_key: "place", osm_value: "state" })).toBe(
      "Province",
    );
    expect(placeCategoryLabel({ osm_key: "natural", osm_value: "water" })).toBe(
      "Water",
    );
    expect(placeCategoryLabel({ osm_key: "leisure", osm_value: "park" })).toBe(
      "Park",
    );
    expect(
      placeCategoryLabel({ osm_key: "tourism", osm_value: "attraction" }),
    ).toBe("Landmark");
  });

  it("falls back to Photon type", () => {
    expect(placeCategoryLabel({ type: "county" })).toBe("County");
    expect(placeCategoryLabel({ type: "country" })).toBe("Country");
  });
});

describe("placeTitleZoomForCategory", () => {
  it("maps categories to title zoom levels", () => {
    expect(placeTitleZoomForCategory("Country")).toBe(5);
    expect(placeTitleZoomForCategory("Province")).toBe(8);
    expect(placeTitleZoomForCategory("City")).toBe(12);
    expect(placeTitleZoomForCategory("Landmark")).toBe(14);
  });
});

describe("enrichGeocodeFromSearchPlace", () => {
  const base: PinGeocode = {
    source: "photon",
    lat: 52.06,
    lng: 4.49,
    fetchedAt: "2026-01-01T00:00:00.000Z",
    properties: { state: "South Holland", country: "Netherlands" },
  };

  it("writes city from a city search pick", () => {
    const next = enrichGeocodeFromSearchPlace(base, {
      primaryName: "Zoetermeer",
      categoryLabel: "City",
    });
    expect(next.properties.city).toBe("Zoetermeer");
    expect(next.properties.state).toBe("South Holland");
  });
});
