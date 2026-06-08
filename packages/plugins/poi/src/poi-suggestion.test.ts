import { describe, expect, it } from "vitest";
import type { PoiNearbyCandidate, PoiPinPayload } from "./poi-pin-data";
import {
  poiPinHasAttachedPoi,
  selectPoiSuggestionCandidate,
  type PoiSuggestionInput,
} from "./poi-suggestion";

function candidate(
  overrides: Partial<PoiNearbyCandidate> = {},
): PoiNearbyCandidate {
  return {
    osmType: "node",
    osmId: 1,
    name: "Café de Klos",
    placeType: "restaurant",
    distanceM: 18,
    tags: { name: "Café de Klos", amenity: "restaurant" },
    ...overrides,
  };
}

const attachedPayload: PoiPinPayload = {
  schemaVersion: 1,
  lat: 52.1,
  lng: 5.1,
  fetchedAt: new Date().toISOString(),
  osmType: "node",
  osmId: 42,
  tags: { name: "Linked place" },
};

const noPoiPayload: PoiPinPayload = {
  schemaVersion: 1,
  lat: 52.1,
  lng: 5.1,
  fetchedAt: new Date().toISOString(),
  noPoi: true,
};

const baseInput: PoiSuggestionInput = {
  pluginReady: true,
  autoLookupEnabled: false,
  attachedPayload: null,
  candidates: [],
};

describe("poiPinHasAttachedPoi", () => {
  it("is true when a place is linked", () => {
    expect(poiPinHasAttachedPoi(attachedPayload)).toBe(true);
  });

  it("is false for noPoi / null payloads", () => {
    expect(poiPinHasAttachedPoi(noPoiPayload)).toBe(false);
    expect(poiPinHasAttachedPoi(null)).toBe(false);
  });
});

describe("selectPoiSuggestionCandidate", () => {
  it("suggests the closest candidate when nothing is attached", () => {
    const result = selectPoiSuggestionCandidate({
      ...baseInput,
      candidates: [
        candidate({ osmId: 2, distanceM: 30 }),
        candidate({ osmId: 3, distanceM: 8 }),
      ],
    });
    expect(result?.osmId).toBe(3);
  });

  it("returns null when the plugin is not ready", () => {
    expect(
      selectPoiSuggestionCandidate({
        ...baseInput,
        pluginReady: false,
        candidates: [candidate()],
      }),
    ).toBeNull();
  });

  it("returns null when auto-lookup (auto-attach) is enabled", () => {
    expect(
      selectPoiSuggestionCandidate({
        ...baseInput,
        autoLookupEnabled: true,
        candidates: [candidate()],
      }),
    ).toBeNull();
  });

  it("returns null when a place is already attached", () => {
    expect(
      selectPoiSuggestionCandidate({
        ...baseInput,
        attachedPayload,
        candidates: [candidate()],
      }),
    ).toBeNull();
  });

  it("returns null when there are no candidates", () => {
    expect(selectPoiSuggestionCandidate(baseInput)).toBeNull();
  });

  it("ignores candidates beyond the suggestion distance", () => {
    expect(
      selectPoiSuggestionCandidate({
        ...baseInput,
        candidates: [candidate({ distanceM: 5000 })],
      }),
    ).toBeNull();
  });
});
