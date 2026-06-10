import type { PlaceSearchResult } from "@curolia/services/geocoding";
import { describe, expect, it } from "vitest";
import { findExactPlaceMatch, isExactPlaceMatch } from "./place-search-match";

function place(
  overrides: Partial<PlaceSearchResult> & Pick<PlaceSearchResult, "id">,
): PlaceSearchResult {
  return {
    primaryName: "Paris",
    fullLabel: "Paris, France",
    lat: 48.8566,
    lng: 2.3522,
    ...overrides,
  };
}

describe("place-search-match", () => {
  it("matches exact primary or full labels", () => {
    const row = place({ id: "1" });
    expect(isExactPlaceMatch("Paris", row)).toBe(true);
    expect(isExactPlaceMatch("Paris, France", row)).toBe(true);
    expect(isExactPlaceMatch("paris", row)).toBe(true);
    expect(isExactPlaceMatch("Par", row)).toBe(false);
  });

  it("returns the first exact match from search results", () => {
    const rows = [
      place({ id: "1", primaryName: "Paris", fullLabel: "Paris, France" }),
      place({ id: "2", primaryName: "Paris", fullLabel: "Paris, TX, USA" }),
    ];
    expect(findExactPlaceMatch("Paris", rows)?.id).toBe("1");
    expect(findExactPlaceMatch("Lyon", rows)).toBeNull();
  });
});
