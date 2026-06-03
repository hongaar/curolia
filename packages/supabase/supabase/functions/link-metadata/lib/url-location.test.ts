import { describe, expect, it } from "vitest";
import { assembleLinkMetadata } from "./extract.ts";
import { parsePageMetadata } from "./html-parse.ts";
import { extractLocationFromUrl } from "./url-location.ts";

describe("extractLocationFromUrl", () => {
  it("parses Google Maps @ coordinates", () => {
    const loc = extractLocationFromUrl(
      "https://www.google.com/maps/@37.7749,-122.4194,15z",
    );
    expect(loc).toMatchObject({ lat: 37.7749, lng: -122.4194 });
  });

  it("parses Google Maps !3d!4d place marker", () => {
    const loc = extractLocationFromUrl(
      "https://www.google.com/maps/place/Test/@37.1,-122.1,14z/data=!3d48.8584!4d2.2945",
    );
    expect(loc).toMatchObject({ lat: 48.8584, lng: 2.2945 });
  });

  it("parses Apple Maps ll=", () => {
    const loc = extractLocationFromUrl(
      "https://maps.apple.com/?ll=37.33,-122.03&q=Cupertino",
    );
    expect(loc).toMatchObject({ lat: 37.33, lng: -122.03 });
  });

  it("parses OpenStreetMap hash", () => {
    const loc = extractLocationFromUrl(
      "https://www.openstreetmap.org/#map=15/48.8566/2.3522",
    );
    expect(loc).toMatchObject({ lat: 48.8566, lng: 2.3522 });
  });

  it("parses geo: URI", () => {
    const loc = extractLocationFromUrl("geo:52.52,13.405");
    expect(loc).toMatchObject({ lat: 52.52, lng: 13.405 });
  });

  it("parses generic lat/lng query params", () => {
    const loc = extractLocationFromUrl(
      "https://example.com/page?latitude=40.7&longitude=-74.0",
    );
    expect(loc).toMatchObject({ lat: 40.7, lng: -74 });
  });
});

describe("parsePageMetadata", () => {
  it("reads og geo and description", () => {
    const html = `<!doctype html><html><head>
      <meta property="og:title" content="Eiffel Tower" />
      <meta property="og:description" content="Iconic tower" />
      <meta property="og:latitude" content="48.8584" />
      <meta property="og:longitude" content="2.2945" />
    </head><body></body></html>`;
    const parsed = parsePageMetadata(html, new URL("https://example.com"));
    expect(parsed.title).toBe("Eiffel Tower");
    expect(parsed.description).toBe("Iconic tower");
    expect(parsed.location).toMatchObject({ lat: 48.8584, lng: 2.2945 });
  });
});

describe("assembleLinkMetadata", () => {
  it("prefers URL coords over HTML when both present", () => {
    const html = `<html><head>
      <meta property="og:latitude" content="1" />
      <meta property="og:longitude" content="1" />
    </head></html>`;
    const result = assembleLinkMetadata({
      url: "https://maps.apple.com/?ll=37.33,-122.03",
      finalUrl: "https://maps.apple.com/?ll=37.33,-122.03",
      html,
    });
    expect(result.location).toMatchObject({ lat: 37.33, lng: -122.03 });
  });
});
