import { describe, expect, it } from "vitest";
import type { ParsedPlace } from "./parsers.ts";
import {
  coordsForPlace,
  coordsFromGoogleMapsUrl,
  countPlacesNeedingCoords,
  countUniqueUrlsNeedingCoords,
  extractCoordsFromMapsHtml,
  resolveMissingCoordsInCache,
  resolveMissingCoordsInCacheBatch,
  type ApiCoordResolver,
  type Coords,
  type UrlLookupContext,
} from "./resolve-place-coords.ts";

function place(
  overrides: Partial<ParsedPlace> & Pick<ParsedPlace, "googleMapsUrl">,
): ParsedPlace {
  return {
    dedupKey: "test",
    title: "Test place",
    note: null,
    lat: null,
    lng: null,
    source: "collection",
    ...overrides,
  };
}

function mockResolver(
  resolveUrl: (context: UrlLookupContext) => Promise<Coords | null>,
): ApiCoordResolver {
  return {
    resolveUrl,
    resolveUrlsBatch: async (contexts) => {
      const map = new Map<string, Coords | null>();
      for (const ctx of contexts) {
        map.set(ctx.url, await resolveUrl(ctx));
      }
      return map;
    },
    getGooglePlacesKeyIssue: () => null,
  };
}

describe("coordsFromGoogleMapsUrl", () => {
  it("reads embedded !3d!4d coordinates", () => {
    const coords = coordsFromGoogleMapsUrl(
      "https://www.google.com/maps/place/Cafe/@41.9,-87.6,17z/data=!3d41.901!4d-87.601",
    );
    expect(coords?.lat).toBeCloseTo(41.901, 3);
    expect(coords?.lng).toBeCloseTo(-87.601, 3);
  });

  it("returns null for place-id-only URLs", () => {
    expect(
      coordsFromGoogleMapsUrl(
        "https://www.google.com/maps/place/Amorino/data=!4m2!3m1!1s0xabc:0xdef",
      ),
    ).toBeNull();
  });
});

describe("extractCoordsFromMapsHtml", () => {
  it("reads !3d!4d from HTML payload", () => {
    const html =
      '<html><body>window.APP="!3d48.860611!4d2.337644";</body></html>';
    const coords = extractCoordsFromMapsHtml(html);
    expect(coords?.lat).toBeCloseTo(48.860611, 4);
    expect(coords?.lng).toBeCloseTo(2.337644, 4);
  });
});

describe("coordsForPlace", () => {
  it("uses cached coordinates when present", () => {
    expect(
      coordsForPlace(
        place({
          googleMapsUrl: "https://www.google.com/maps/place/A",
          lat: 1.2,
          lng: 3.4,
        }),
      ),
    ).toEqual({ lat: 1.2, lng: 3.4 });
  });

  it("falls back to sync URL parsing", () => {
    const coords = coordsForPlace(
      place({
        googleMapsUrl:
          "https://www.google.com/maps/place/Cafe/@41.9,-87.6,17z/data=!3d41.901!4d-87.601",
      }),
    );
    expect(coords?.lat).toBeCloseTo(41.901, 3);
  });
});

describe("resolveMissingCoordsInCache", () => {
  it("applies resolved coordinates and dedupes by URL", async () => {
    const minimalUrl =
      "https://www.google.com/maps/place/Amorino/data=!4m2!3m1!1s0xabc:0xdef";
    const resolved = { lat: 48.860611, lng: 2.337644 };

    const cache = {
      collections: {
        byName: {
          Paris: {
            name: "Paris",
            description: null,
            places: [
              place({
                googleMapsUrl: minimalUrl,
                dedupKey: "a",
                title: "Amorino",
              }),
              place({
                googleMapsUrl: minimalUrl,
                dedupKey: "b",
                title: "Amorino copy",
              }),
            ],
          },
        },
      },
    };

    expect(countPlacesNeedingCoords(cache)).toBe(2);

    await resolveMissingCoordsInCache(cache, {
      resolver: mockResolver(async (ctx) =>
        ctx.url === minimalUrl ? resolved : null,
      ),
    });

    expect(countPlacesNeedingCoords(cache)).toBe(0);
    expect(cache.collections!.byName.Paris!.places[0]?.lat).toBeCloseTo(
      48.860611,
      4,
    );
    expect(cache.collections!.byName.Paris!.places[1]?.lng).toBeCloseTo(
      2.337644,
      4,
    );
  });

  it("reports progress while resolving", async () => {
    const cache = {
      starred: {
        places: [
          place({
            googleMapsUrl:
              "https://www.google.com/maps/place/A/data=!4m2!3m1!1s0x1:0x2",
            dedupKey: "a",
          }),
          place({
            googleMapsUrl:
              "https://www.google.com/maps/place/B/data=!4m2!3m1!1s0x3:0x4",
            dedupKey: "b",
          }),
        ],
      },
    };

    const progress: Array<{ done: number; total: number; phase: string }> = [];
    await resolveMissingCoordsInCache(cache, {
      resolver: mockResolver(async () => ({ lat: 1, lng: 2 })),
      onProgress: async (update) => {
        progress.push(update);
      },
    });

    expect(progress.length).toBe(1);
    expect(progress[0]?.phase).toContain("2/2");
    expect(progress[0]?.done).toBe(2);
    expect(countPlacesNeedingCoords(cache)).toBe(0);
  });

  it("processes URLs in batches and marks failed lookups as attempted", async () => {
    const makeUrl = (n: number) =>
      `https://www.google.com/maps/place/P${n}/data=!4m2!3m1!1s0x${n}:0x${n}`;

    const cache = {
      starred: {
        places: Array.from({ length: 5 }, (_, index) =>
          place({
            googleMapsUrl: makeUrl(index),
            dedupKey: `p-${index}`,
            title: `Place ${index}`,
          }),
        ),
      },
    };

    let calls = 0;
    const first = await resolveMissingCoordsInCacheBatch(cache, {
      maxUrls: 2,
      resolver: mockResolver(async () => {
        calls += 1;
        return calls % 2 === 0 ? { lat: 1, lng: 2 } : null;
      }),
    });

    expect(first.urlsProcessed).toBe(2);
    expect(first.complete).toBe(false);
    expect(first.urlsRemaining).toBe(3);
    expect(countUniqueUrlsNeedingCoords(cache)).toBe(3);

    const second = await resolveMissingCoordsInCacheBatch(cache, {
      maxUrls: 10,
      urlsTotal: first.urlsTotal,
      urlsDoneOffset: first.urlsDone,
      resolver: mockResolver(async () => null),
    });

    expect(second.complete).toBe(true);
    expect(countPlacesNeedingCoords(cache)).toBe(0);
    expect(
      cache.starred!.places.every(
        (entry) => entry.coordLookupAttempted === true,
      ),
    ).toBe(true);
  });
});
