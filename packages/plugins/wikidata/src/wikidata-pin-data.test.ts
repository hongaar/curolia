import { describe, expect, it } from "vitest";
import {
  looksLikeWikidataId,
  wikidataCandidateTitle,
  wikidataDisplayLabel,
  type WikidataNearbyCandidate,
} from "./wikidata-pin-data";

describe("looksLikeWikidataId", () => {
  it("detects Q-id labels", () => {
    expect(looksLikeWikidataId("Q2540485")).toBe(true);
    expect(looksLikeWikidataId("Gezicht Zeist")).toBe(false);
  });
});

describe("wikidataDisplayLabel", () => {
  it("falls back to the Wikipedia title for Q-id labels", () => {
    expect(
      wikidataDisplayLabel({
        label: "Q2540485",
        wikipediaTitle: "Gezicht Zeist",
      }),
    ).toBe("Gezicht Zeist");
  });
});

describe("wikidataCandidateTitle", () => {
  it("prefers the article title when the candidate label is a Q-id", () => {
    const candidate: WikidataNearbyCandidate = {
      wikidataId: "Q20732266",
      label: "Q20732266",
      wikipediaTitle: "Huis Zeist",
      wikipediaLang: "nl",
      distanceM: 94,
      placeType: "buitenplaats",
      thumbnailUrl: null,
    };
    expect(wikidataCandidateTitle(candidate)).toBe("Huis Zeist");
  });
});
