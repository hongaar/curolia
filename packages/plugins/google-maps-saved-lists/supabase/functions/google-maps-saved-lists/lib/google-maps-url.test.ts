import { describe, expect, it } from "vitest";
import {
  extractGoogleMapsCidFromUrl,
  extractLocationFromGoogleMapsUrl,
  extractTitleFromGoogleMapsUrl,
  isGoogleMapsPlaceUrl,
  normalizeGoogleMapsPlaceKey,
} from "./google-maps-url.ts";

describe("extractGoogleMapsCidFromUrl", () => {
  it("reads decimal cid from ?cid= query param", () => {
    expect(
      extractGoogleMapsCidFromUrl(
        "https://maps.google.com/?cid=12345678901234567890",
      ),
    ).toBe("12345678901234567890");
  });

  it("derives decimal cid from feature id in place URL", () => {
    const url =
      "https://www.google.com/maps/place/Wrigley+Field/data=!4m2!3m1!1s0x880fd3b2e59adf21:0x1cea3ee176ddd646";
    expect(extractGoogleMapsCidFromUrl(url)).toBe("2083546915695089222");
  });
});

describe("normalizeGoogleMapsPlaceKey", () => {
  it("prefers place CID from data URL", () => {
    const url =
      "https://www.google.com/maps/place/Wrigley+Field/data=!4m2!3m1!1s0x880fd3b2e59adf21:0x1cea3ee176ddd646";
    expect(normalizeGoogleMapsPlaceKey(url)).toBe(
      "cid:0x880fd3b2e59adf21:0x1cea3ee176ddd646",
    );
  });

  it("dedupes same place with different tracking params", () => {
    const a =
      "https://www.google.com/maps/place/Cafe/data=!4m2!3m1!1s0xabc:0xdef";
    const b = a + "&utm_source=share";
    expect(normalizeGoogleMapsPlaceKey(a)).toBe(normalizeGoogleMapsPlaceKey(b));
  });
});

describe("extractLocationFromGoogleMapsUrl", () => {
  it("reads !3d!4d coordinates", () => {
    const url =
      "https://www.google.com/maps/place/Test/@41.9484,-87.6553,17z/data=!3m1!4b1!4m6!3m5!1s0x1!2sTest!8m2!3d41.948438!4d-87.653333";
    const loc = extractLocationFromGoogleMapsUrl(url);
    expect(loc?.lat).toBeCloseTo(41.948438, 4);
    expect(loc?.lng).toBeCloseTo(-87.653333, 4);
  });

  it("reads @lat,lng from path", () => {
    const url = "https://www.google.com/maps/@48.8566,2.3522,14z";
    const loc = extractLocationFromGoogleMapsUrl(url);
    expect(loc?.lat).toBeCloseTo(48.8566, 3);
    expect(loc?.lng).toBeCloseTo(2.3522, 3);
  });
});

describe("extractTitleFromGoogleMapsUrl", () => {
  it("extracts place name from path", () => {
    const url = "https://www.google.com/maps/place/Wrigley+Field/";
    expect(extractTitleFromGoogleMapsUrl(url)).toBe("Wrigley Field");
  });
});

describe("isGoogleMapsPlaceUrl", () => {
  it("accepts maps.google.com place links", () => {
    expect(isGoogleMapsPlaceUrl("https://maps.google.com/maps?q=Paris")).toBe(
      true,
    );
  });

  it("rejects non-maps URLs", () => {
    expect(isGoogleMapsPlaceUrl("https://example.com/")).toBe(false);
  });
});
