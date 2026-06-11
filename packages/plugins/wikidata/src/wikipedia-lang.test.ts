import { describe, expect, it } from "vitest";
import {
  countryLanguageHints,
  readWikipediaLanguageSetting,
  resolveLangPrefs,
  WIKIPEDIA_LANGUAGE_AUTO,
} from "./wikipedia-lang";

describe("readWikipediaLanguageSetting", () => {
  it("defaults to auto", () => {
    expect(readWikipediaLanguageSetting(null)).toBe(WIKIPEDIA_LANGUAGE_AUTO);
    expect(readWikipediaLanguageSetting({})).toBe(WIKIPEDIA_LANGUAGE_AUTO);
  });

  it("reads wikidata.wikipediaLanguage", () => {
    expect(
      readWikipediaLanguageSetting({
        wikidata: { wikipediaLanguage: "nl" },
      }),
    ).toBe("nl");
  });
});

describe("resolveLangPrefs", () => {
  it("uses explicit language", () => {
    expect(resolveLangPrefs("nl")).toEqual(["nl", "en"]);
  });

  it("uses browser and country hints in auto mode", () => {
    expect(
      resolveLangPrefs(WIKIPEDIA_LANGUAGE_AUTO, {
        browserLang: "nl-NL",
        country: "Netherlands",
      }),
    ).toEqual(["nl", "en"]);
  });

  it("falls back to english", () => {
    expect(resolveLangPrefs("de")).toEqual(["de", "en"]);
  });
});

describe("countryLanguageHints", () => {
  it("maps netherlands to dutch", () => {
    expect(countryLanguageHints("Netherlands")).toEqual(["nl"]);
  });
});
