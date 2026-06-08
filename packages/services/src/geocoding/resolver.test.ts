import { describe, expect, it } from "vitest";
import { coordsFromMapShareUrl } from "./map-url.ts";
import {
  coordsForPlace,
  countPlacesNeedingCoords,
  countUniqueUrlsNeedingCoords,
  extractCoordsFromMapsHtml,
  resolveMissingCoordsInCache,
  resolveMissingCoordsInCacheBatch,
  type CoordResolver,
  type Coords,
  type UrlLookupContext,
} from "./resolver.ts";

type TestPlace = {
  googleMapsUrl: string;
  title: string;
  note?: string | null;
  collectionName?: string;
  lat?: number | null;
  lng?: number | null;
  coordLookupAttempted?: boolean;
};

function place(
  overrides: Partial<TestPlace> & Pick<TestPlace, "googleMapsUrl">,
): TestPlace {
  return {
    title: "Test place",
    note: null,
    lat: null,
    lng: null,
    ...overrides,
  };
}

function mockResolver(
  resolveUrl: (context: UrlLookupContext) => Promise<Coords | null>,
): CoordResolver {
  return {
    resolveUrl,
    resolveUrlsBatch: async (contexts: readonly UrlLookupContext[]) => {
      const map = new Map<string, Coords | null>();
      for (const ctx of contexts) {
        map.set(ctx.url, await resolveUrl(ctx));
      }
      return map;
    },
    getPlacesLookupKeyIssue: () => null,
  };
}

describe("coordsFromMapShareUrl", () => {
  it("reads embedded !3d!4d coordinates", () => {
    const coords = coordsFromMapShareUrl(
      "https://www.google.com/maps/place/Cafe/@41.9,-87.6,17z/data=!3d41.901!4d-87.601",
    );
    expect(coords).toEqual({ lat: 41.901, lng: -87.601 });
  });
});

describe("coordsForPlace", () => {
  it("uses stored lat/lng when present", () => {
    expect(
      coordsForPlace(
        place({
          googleMapsUrl: "https://maps.google.com/",
          lat: 1,
          lng: 2,
        }),
      ),
    ).toEqual({ lat: 1, lng: 2 });
  });
});

describe("resolveMissingCoordsInCache", () => {
  it("resolves coords via injected resolver", async () => {
    const cache = {
      starred: {
        places: [
          place({
            googleMapsUrl: "https://example.com/no-coords",
            title: "Mystery Cafe",
          }),
        ],
      },
    };

    await resolveMissingCoordsInCache(cache, {
      resolver: mockResolver(async () => ({ lat: 10, lng: 20 })),
    });

    expect(cache.starred.places[0]?.lat).toBe(10);
    expect(cache.starred.places[0]?.lng).toBe(20);
  });
});

describe("resolveMissingCoordsInCacheBatch", () => {
  it("marks batch complete when all URLs resolved", async () => {
    const url =
      "https://www.google.com/maps/place/Cafe/@41.9,-87.6,17z/data=!3d41.901!4d-87.601";
    const cache = {
      collections: {
        byName: {
          Food: {
            places: [place({ googleMapsUrl: url, title: "Cafe" })],
          },
        },
      },
    };

    const result = await resolveMissingCoordsInCacheBatch(cache, {
      resolver: mockResolver(async () => null),
    });

    expect(result.complete).toBe(true);
    expect(result.placesResolved).toBe(1);
  });
});

describe("countPlacesNeedingCoords", () => {
  it("counts places without coords", () => {
    const cache = {
      starred: {
        places: [
          place({ googleMapsUrl: "https://a", lat: 1, lng: 2 }),
          place({ googleMapsUrl: "https://b" }),
        ],
      },
    };
    expect(countPlacesNeedingCoords(cache)).toBe(1);
    expect(countUniqueUrlsNeedingCoords(cache)).toBe(1);
  });
});

describe("extractCoordsFromMapsHtml", () => {
  it("extracts !3d!4d from HTML snippet", () => {
    expect(extractCoordsFromMapsHtml("foo !3d41.901!4d-87.601 bar")).toEqual({
      lat: 41.901,
      lng: -87.601,
    });
  });
});
