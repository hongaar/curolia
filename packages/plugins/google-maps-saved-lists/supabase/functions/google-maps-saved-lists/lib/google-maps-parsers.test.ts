import { describe, expect, it } from "vitest";
import {
  normalizeGoogleMapsPlaceKey,
  parseSavedCollectionsCsv,
  parseStarredGeoJson,
} from "./google-maps-parsers.ts";

describe("parseStarredGeoJson", () => {
  it("parses FeatureCollection with coordinates", () => {
    const geojson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-87.653, 41.948] },
          properties: {
            google_maps_url:
              "https://www.google.com/maps/place/Wrigley+Field/data=!4m2!3m1!1s0x880fd3b2e59adf21:0x1cea3ee176ddd646",
          },
          location: [{ name: "Wrigley Field" }],
        },
      ],
    });

    const places = parseStarredGeoJson(geojson);
    expect(places).toHaveLength(1);
    expect(places[0]?.title).toBe("Wrigley Field");
    expect(places[0]?.lat).toBeCloseTo(41.948, 2);
    expect(places[0]?.lng).toBeCloseTo(-87.653, 2);
    expect(places[0]?.dedupKey).toBe(
      normalizeGoogleMapsPlaceKey(places[0]!.googleMapsUrl),
    );
  });
});

describe("parseSavedCollectionsCsv", () => {
  it("parses collection CSV with Maps place URLs", () => {
    const csv = [
      "title,note,item_content_url",
      '"Cafe Roma","Try the espresso","https://www.google.com/maps/place/Cafe+Roma/@41.9,-87.6,17z/data=!3d41.901!4d-87.601"',
      "Not a place,,https://example.com/page",
    ].join("\n");

    const col = parseSavedCollectionsCsv("Trip list.csv", csv);
    expect(col?.name).toBe("Trip list");
    expect(col?.places).toHaveLength(1);
    expect(col?.places[0]?.title).toBe("Cafe Roma");
    expect(col?.places[0]?.note).toBe("Try the espresso");
    expect(col?.places[0]?.lat).toBeCloseTo(41.901, 2);
  });

  it("parses Google Data Portability CSV with URL column header", () => {
    const csv = [
      "Title,Note,URL,Tags,Comment",
      ",,,,",
      "Amorino,,https://www.google.com/maps/place/Amorino/data=!4m2!3m1!1s0xabc:0xdef,,",
      "Empty row,,,,",
    ].join("\n");

    const col = parseSavedCollectionsCsv("Paris day 2.csv", csv);
    expect(col?.name).toBe("Paris day 2");
    expect(col?.places).toHaveLength(1);
    expect(col?.places[0]?.title).toBe("Amorino");
  });
});
