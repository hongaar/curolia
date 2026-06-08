import { describe, expect, it } from "vitest";
import type {
  WikidataNearbyCandidate,
  WikidataPinPayload,
} from "./wikidata-pin-data";
import {
  selectWikidataSuggestionCandidate,
  type WikidataSuggestionInput,
} from "./wikidata-suggestion";

function candidate(
  overrides: Partial<WikidataNearbyCandidate> = {},
): WikidataNearbyCandidate {
  return {
    wikidataId: "Q1",
    label: "Rijksmuseum",
    wikipediaTitle: "Rijksmuseum",
    distanceM: 80,
    placeType: "museum",
    thumbnailUrl: null,
    ...overrides,
  };
}

const attachedPayload: WikidataPinPayload = {
  schemaVersion: 1,
  lat: 52.1,
  lng: 5.1,
  fetchedAt: new Date().toISOString(),
  wikidataId: "Q42",
  wikipediaTitle: "Linked",
  wikipediaUrl: "https://en.wikipedia.org/wiki/Linked",
  label: "Linked",
  extract: "…",
  thumbnailUrl: null,
  distanceM: 10,
  placeType: null,
};

const baseInput: WikidataSuggestionInput = {
  pluginReady: true,
  attachedPayload: null,
  candidates: [],
};

describe("selectWikidataSuggestionCandidate", () => {
  it("suggests the closest candidate when nothing is attached", () => {
    const result = selectWikidataSuggestionCandidate({
      ...baseInput,
      candidates: [
        candidate({ wikidataId: "Q2", distanceM: 200 }),
        candidate({ wikidataId: "Q3", distanceM: 40 }),
      ],
    });
    expect(result?.wikidataId).toBe("Q3");
  });

  it("returns null when the plugin is not ready", () => {
    expect(
      selectWikidataSuggestionCandidate({
        ...baseInput,
        pluginReady: false,
        candidates: [candidate()],
      }),
    ).toBeNull();
  });

  it("returns null when an article is already attached", () => {
    expect(
      selectWikidataSuggestionCandidate({
        ...baseInput,
        attachedPayload,
        candidates: [candidate()],
      }),
    ).toBeNull();
  });

  it("returns null when there are no candidates", () => {
    expect(selectWikidataSuggestionCandidate(baseInput)).toBeNull();
  });

  it("ignores candidates beyond the suggestion distance", () => {
    expect(
      selectWikidataSuggestionCandidate({
        ...baseInput,
        candidates: [candidate({ distanceM: 480 })],
      }),
    ).toBeNull();
  });
});
