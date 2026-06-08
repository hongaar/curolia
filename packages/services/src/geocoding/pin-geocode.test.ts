import { describe, expect, it } from "vitest";
import {
  availableLocationLabelPatterns,
  defaultLocationLabelDetail,
  geocodeMatchesCoords,
  locationLabelDetailPreviewItems,
  locationLabelForDetail,
  pinLocationLabel,
  type PinGeocode,
} from "./pin-geocode.ts";

const parisSample: PinGeocode = {
  source: "photon",
  lat: 48.85,
  lng: 2.33,
  fetchedAt: "2026-01-01T00:00:00.000Z",
  properties: {
    name: "Rue de Rivoli",
    street: "Rue de Rivoli",
    city: "Paris",
    state: "Île-de-France",
    country: "France",
  },
};

const cityOnlySample: PinGeocode = {
  source: "photon",
  lat: -1.28,
  lng: 36.85,
  fetchedAt: "2026-01-01T00:00:00.000Z",
  properties: {
    name: "Nairobi",
    city: "Nairobi",
    country: "Kenya",
  },
};

describe("locationLabelForDetail", () => {
  it("formats street, city, country", () => {
    expect(locationLabelForDetail(parisSample, "street_city_country")).toBe(
      "Rue de Rivoli, Paris, France",
    );
  });

  it("formats street, city, region, country", () => {
    expect(
      locationLabelForDetail(parisSample, "street_city_region_country"),
    ).toBe("Rue de Rivoli, Paris, Île-de-France, France");
  });

  it("formats city, country", () => {
    expect(locationLabelForDetail(cityOnlySample, "city_country")).toBe(
      "Nairobi, Kenya",
    );
  });
});

describe("availableLocationLabelPatterns", () => {
  it("includes all distinct levels for Paris", () => {
    expect(availableLocationLabelPatterns(parisSample)).toEqual([
      "street_city_region_country",
      "street_city_country",
      "city_region_country",
      "city_country",
      "region_country",
      "country",
    ]);
  });

  it("omits street patterns when street equals city", () => {
    const patterns = availableLocationLabelPatterns(cityOnlySample);
    expect(patterns).not.toContain("street_city_country");
    expect(patterns).not.toContain("street_city_region_country");
    expect(patterns).toContain("city_country");
    expect(patterns).toContain("country");
  });
});

describe("defaultLocationLabelDetail", () => {
  it("prefers street_city_country when available", () => {
    expect(defaultLocationLabelDetail(parisSample)).toBe("street_city_country");
  });

  it("falls back to first available pattern", () => {
    expect(defaultLocationLabelDetail(cityOnlySample)).toBe("city_country");
  });
});

describe("locationLabelDetailPreviewItems", () => {
  it("only includes available patterns", () => {
    const items = locationLabelDetailPreviewItems(cityOnlySample);
    expect(Object.keys(items).sort()).toEqual(["city_country", "country"]);
    expect(items.city_country).toBe("Nairobi, Kenya");
  });
});

describe("geocodeMatchesCoords", () => {
  it("returns true when coordinates match", () => {
    expect(geocodeMatchesCoords(parisSample, 48.85, 2.33)).toBe(true);
  });
});

describe("pinLocationLabel", () => {
  it("derives label from geocode and detail preference", () => {
    expect(
      pinLocationLabel({
        geocode: parisSample,
        location_label_detail: "city_country",
      }),
    ).toBe("Paris, France");
  });
});
