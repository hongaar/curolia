import { describe, expect, it } from "vitest";
import type {
  WikidataDeclinedPayload,
  WikidataNearbyCandidate,
  WikidataPinPayload,
} from "./wikidata-pin-data";
import {
  selectWikidataSuggestionCandidate,
  wikidataPinSuggestionSuppressed,
  type WikidataSuggestionInput,
} from "./wikidata-suggestion";

function candidate(
  overrides: Partial<WikidataNearbyCandidate> = {},
): WikidataNearbyCandidate {
  return {
    wikidataId: "Q1",
    label: "Rijksmuseum",
    wikipediaTitle: "Rijksmuseum",
    wikipediaLang: "en",
    distanceM: 80,
    placeType: "museum",
    thumbnailUrl: null,
    ...overrides,
  };
}

const attachedPayload: WikidataPinPayload = {
  schemaVersion: 2,
  lat: 52.1,
  lng: 5.1,
  fetchedAt: new Date().toISOString(),
  wikidataId: "Q42",
  wikipediaLang: "en",
  wikipediaTitle: "Linked",
  wikipediaUrl: "https://en.wikipedia.org/wiki/Linked",
  label: "Linked",
  extract: "…",
  thumbnailUrl: null,
  distanceM: 10,
  placeType: null,
};

const declinedPayload: WikidataDeclinedPayload = {
  schemaVersion: 1,
  lat: 52.1,
  lng: 5.1,
  fetchedAt: new Date().toISOString(),
  declined: true,
};

const baseInput: WikidataSuggestionInput = {
  pluginReady: true,
  attachedPayload: null,
  declinedPayload: null,
  pinLat: 52.1,
  pinLng: 5.1,
  candidates: [],
};

describe("wikidataPinSuggestionSuppressed", () => {
  it("is true when an article is attached", () => {
    expect(
      wikidataPinSuggestionSuppressed(attachedPayload, null, 52.1, 5.1),
    ).toBe(true);
  });

  it("is true when the user declined at the same coords", () => {
    expect(
      wikidataPinSuggestionSuppressed(null, declinedPayload, 52.1, 5.1),
    ).toBe(true);
  });

  it("is false when the pin moved after a decline", () => {
    expect(
      wikidataPinSuggestionSuppressed(null, declinedPayload, 52.2, 5.2),
    ).toBe(false);
  });
});

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

  it("returns null when the user previously declined at these coords", () => {
    expect(
      selectWikidataSuggestionCandidate({
        ...baseInput,
        declinedPayload,
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
