import { describe, expect, it } from "vitest";
import {
  formatPlaceCoordinates,
  placeSearchPanelDetails,
  placeSearchPanelSubtitle,
} from "./place-search-panel.ts";
import type { PlaceSearchResult } from "./types.ts";

const zoetermeer: PlaceSearchResult = {
  id: "photon-0",
  primaryName: "Zoetermeer",
  fullLabel: "Zoetermeer, South Holland, Netherlands",
  lat: 52.0575,
  lng: 4.4931,
  categoryLabel: "City",
  properties: {
    name: "Zoetermeer",
    city: "Zoetermeer",
    state: "South Holland",
    country: "Netherlands",
    type: "city",
    osm_key: "place",
    osm_value: "city",
  },
};

const street: PlaceSearchResult = {
  id: "photon-1",
  primaryName: "Rue de Rivoli",
  fullLabel: "Rue de Rivoli, Paris, France",
  lat: 48.8606,
  lng: 2.3376,
  categoryLabel: "Street",
  properties: {
    name: "Rue de Rivoli",
    street: "Rue de Rivoli",
    city: "Paris",
    country: "France",
    osm_key: "highway",
    osm_value: "residential",
  },
};

describe("placeSearchPanelSubtitle", () => {
  it("drops the primary name from a full label", () => {
    expect(placeSearchPanelSubtitle(zoetermeer)).toBe(
      "South Holland, Netherlands",
    );
  });

  it("builds a subtitle from geocode properties", () => {
    expect(
      placeSearchPanelSubtitle({
        ...zoetermeer,
        fullLabel: "Zoetermeer",
      }),
    ).toBe("South Holland, Netherlands");
  });
});

describe("placeSearchPanelDetails", () => {
  it("lists structured geocode fields and coordinates", () => {
    expect(placeSearchPanelDetails(street)).toEqual([
      { label: "City", value: "Paris" },
      { label: "Country", value: "France" },
      {
        label: "Coordinates",
        value: formatPlaceCoordinates(street.lat, street.lng),
      },
    ]);
  });

  it("skips values that duplicate the primary title", () => {
    expect(placeSearchPanelDetails(zoetermeer)).toEqual([
      { label: "Region", value: "South Holland" },
      { label: "Country", value: "Netherlands" },
      {
        label: "Coordinates",
        value: formatPlaceCoordinates(zoetermeer.lat, zoetermeer.lng),
      },
    ]);
  });

  it("always includes coordinates even without properties", () => {
    expect(
      placeSearchPanelDetails({
        id: "x",
        primaryName: "Somewhere",
        fullLabel: "Somewhere",
        lat: 0,
        lng: 0,
      }),
    ).toEqual([{ label: "Coordinates", value: "0.00000° N, 0.00000° E" }]);
  });
});
