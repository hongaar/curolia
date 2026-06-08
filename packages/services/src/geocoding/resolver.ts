import type { Coords } from "../coords.ts";
import {
  buildGeoapifySearchText,
  createGeoapifyClient,
  GEOAPIFY_BATCH_MIN_SIZE,
  type GeoapifyClient,
} from "./geoapify.ts";
import {
  coordsFromGoogleMapsUrl,
  extractGoogleMapsCidFromUrl,
  extractTitleFromGoogleMapsUrl,
} from "./google-maps-url.ts";
import {
  createGooglePlacesClient,
  type GooglePlacesClient,
} from "./google-places.ts";
import type {
  CoordResolver,
  CoordResolverConfig,
  UrlLookupContext,
} from "./types.ts";

const DEFAULT_BATCH_MAX_URLS = 40;
const DEFAULT_BATCH_TIME_BUDGET_MS = 90_000;

export type { Coords, UrlLookupContext };

export type CoordLookupPlace = {
  googleMapsUrl: string;
  title: string;
  note?: string | null;
  collectionName?: string;
  lat?: number | null;
  lng?: number | null;
  coordLookupAttempted?: boolean;
};

export type ExportCacheLike = {
  starred?: { places: CoordLookupPlace[] };
  collections?: { byName: Record<string, { places: CoordLookupPlace[] }> };
};

export type { CoordResolver, CoordResolverConfig };

export function createCoordResolver(
  config: CoordResolverConfig,
): CoordResolver {
  const googlePlaces = createGooglePlacesClient(config.placesLookupApiKey);
  const geoapify = createGeoapifyClient(config.forwardGeocodeApiKey);

  return {
    resolveUrl: (context) =>
      resolveUrlWithApis(context, googlePlaces, geoapify, {
        allowForwardGeocode: true,
      }),
    resolveUrlsBatch: (contexts, options) =>
      resolveUrlsBatchWithApis(contexts, googlePlaces, geoapify, options),
    getPlacesLookupKeyIssue: () => googlePlaces?.getKeyIssue() ?? null,
  };
}

export function placeHasCoords(place: CoordLookupPlace): boolean {
  return place.lat != null && place.lng != null;
}

export function coordsForPlace(place: CoordLookupPlace): Coords | null {
  if (placeHasCoords(place)) {
    return { lat: place.lat!, lng: place.lng! };
  }
  return coordsFromGoogleMapsUrl(place.googleMapsUrl);
}

export function collectCachedPlaces(
  cache: ExportCacheLike,
): CoordLookupPlace[] {
  const places: CoordLookupPlace[] = [];
  if (cache.starred?.places) places.push(...cache.starred.places);
  for (const collection of Object.values(cache.collections?.byName ?? {})) {
    places.push(...collection.places);
  }
  return places;
}

export function placeNeedsCoordLookup(place: CoordLookupPlace): boolean {
  return !placeHasCoords(place) && place.coordLookupAttempted !== true;
}

export function countPlacesNeedingCoords(cache: ExportCacheLike): number {
  return collectCachedPlaces(cache).filter((place) =>
    placeNeedsCoordLookup(place),
  ).length;
}

export function countPlacesWithCoords(cache: ExportCacheLike): number {
  return collectCachedPlaces(cache).filter((place) => placeHasCoords(place))
    .length;
}

export function uniqueUrlsNeedingCoords(cache: ExportCacheLike): string[] {
  const urls = new Set<string>();
  for (const place of collectCachedPlaces(cache)) {
    if (placeNeedsCoordLookup(place)) urls.add(place.googleMapsUrl);
  }
  return [...urls];
}

export function countUniqueUrlsNeedingCoords(cache: ExportCacheLike): number {
  return uniqueUrlsNeedingCoords(cache).length;
}

export function urlLookupContextsForCache(
  cache: ExportCacheLike,
): Map<string, UrlLookupContext> {
  const contexts = new Map<string, UrlLookupContext>();
  for (const place of collectCachedPlaces(cache)) {
    if (!placeNeedsCoordLookup(place)) continue;
    if (contexts.has(place.googleMapsUrl)) continue;
    contexts.set(place.googleMapsUrl, {
      url: place.googleMapsUrl,
      title: place.title,
      collectionName: place.collectionName,
      note: place.note,
    });
  }
  return contexts;
}

function markUrlLookupAttempted(cache: ExportCacheLike, url: string): void {
  for (const place of collectCachedPlaces(cache)) {
    if (place.googleMapsUrl === url) {
      place.coordLookupAttempted = true;
    }
  }
}

function buildPlacesTextQuery(context: UrlLookupContext): string | null {
  const title =
    context.title.trim() ||
    extractTitleFromGoogleMapsUrl(context.url)?.trim() ||
    "";
  if (!title) return null;
  return buildGeoapifySearchText({
    title,
    collectionName: context.collectionName,
    note: context.note,
  });
}

async function resolveUrlWithGooglePlaces(
  context: UrlLookupContext,
  googlePlaces: GooglePlacesClient | null,
): Promise<Coords | null> {
  if (!googlePlaces) return null;

  const cid = extractGoogleMapsCidFromUrl(context.url);
  if (cid) {
    const fromCid = await googlePlaces.fetchCoordsByCid(cid);
    if (fromCid) return fromCid;
  }

  const textQuery = buildPlacesTextQuery(context);
  if (textQuery) {
    return googlePlaces.fetchCoordsByTextQuery(textQuery);
  }

  return null;
}

async function resolveUrlWithApis(
  context: UrlLookupContext,
  googlePlaces: GooglePlacesClient | null,
  geoapify: GeoapifyClient | null,
  options: { allowForwardGeocode: boolean },
): Promise<Coords | null> {
  const sync = coordsFromGoogleMapsUrl(context.url);
  if (sync) return sync;

  const fromPlaces = await resolveUrlWithGooglePlaces(context, googlePlaces);
  if (fromPlaces) return fromPlaces;

  if (!options.allowForwardGeocode || !geoapify) return null;

  const geocodeText = buildPlacesTextQuery(context);
  if (!geocodeText) return null;
  return geoapify.geocodeText(geocodeText);
}

async function resolveUrlsBatchWithApis(
  contexts: readonly UrlLookupContext[],
  googlePlaces: GooglePlacesClient | null,
  geoapify: GeoapifyClient | null,
  options?: { timeBudgetMs?: number },
): Promise<Map<string, Coords | null>> {
  const results = new Map<string, Coords | null>();
  const geoapifyQueue: UrlLookupContext[] = [];
  const timeBudgetMs = options?.timeBudgetMs ?? DEFAULT_BATCH_TIME_BUDGET_MS;
  const startedAt = Date.now();

  for (const context of contexts) {
    if (Date.now() - startedAt >= timeBudgetMs) break;

    const sync = coordsFromGoogleMapsUrl(context.url);
    if (sync) {
      results.set(context.url, sync);
      continue;
    }

    const fromPlaces = await resolveUrlWithGooglePlaces(context, googlePlaces);
    if (fromPlaces) {
      results.set(context.url, fromPlaces);
      continue;
    }

    if (geoapify && buildPlacesTextQuery(context)) {
      geoapifyQueue.push(context);
    } else {
      results.set(context.url, null);
    }
  }

  if (geoapifyQueue.length > 0) {
    const remainingMs = Math.max(0, timeBudgetMs - (Date.now() - startedAt));
    const queries = geoapifyQueue.map((ctx) => buildPlacesTextQuery(ctx)!);

    let geoCoords: (Coords | null)[];
    if (
      geoapifyQueue.length >= GEOAPIFY_BATCH_MIN_SIZE &&
      remainingMs >= GEOAPIFY_BATCH_MIN_SIZE * 200
    ) {
      geoCoords = await geoapify!.geocodeTextBatch(queries, {
        deadlineMs: remainingMs,
      });
    } else {
      geoCoords = [];
      for (const query of queries) {
        if (Date.now() - startedAt >= timeBudgetMs) {
          geoCoords.push(null);
          continue;
        }
        geoCoords.push(await geoapify!.geocodeText(query));
      }
    }

    for (let index = 0; index < geoapifyQueue.length; index++) {
      results.set(geoapifyQueue[index]!.url, geoCoords[index] ?? null);
    }
  }

  return results;
}

export type ResolveMissingCoordsOptions = {
  concurrency?: number;
  resolver?: CoordResolver;
  resolverConfig?: CoordResolverConfig;
  onProgress?: (update: {
    done: number;
    total: number;
    resolved: number;
    phase: string;
  }) => void | Promise<void>;
};

export type ResolveMissingCoordsBatchOptions = ResolveMissingCoordsOptions & {
  maxUrls?: number;
  timeBudgetMs?: number;
  urlsDoneOffset?: number;
  urlsTotal?: number;
  placesTotal?: number;
};

export type ResolveMissingCoordsBatchResult = {
  cache: ExportCacheLike;
  urlsProcessed: number;
  urlsDone: number;
  urlsTotal: number;
  urlsRemaining: number;
  placesResolved: number;
  placesTotal: number;
  complete: boolean;
  placesLookupKeyIssue: string | null;
};

function progressPhase(done: number, total: number, resolved: number): string {
  return `Resolving coordinates (${done}/${total} URLs, ${resolved} with coords)…`;
}

function applySyncCoordsPass(cache: ExportCacheLike): void {
  for (const place of collectCachedPlaces(cache)) {
    if (!placeNeedsCoordLookup(place)) continue;
    const sync = coordsForPlace(place);
    if (sync) {
      place.lat = sync.lat;
      place.lng = sync.lng;
      place.coordLookupAttempted = true;
    }
  }
}

function resolveApiResolver(
  options?: ResolveMissingCoordsOptions,
): CoordResolver {
  if (options?.resolver) return options.resolver;
  return createCoordResolver(options?.resolverConfig ?? {});
}

/**
 * Resolves up to `maxUrls` unique Maps URLs per call so edge workers stay
 * within execution limits. Mutates `cache`.
 */
export async function resolveMissingCoordsInCacheBatch(
  cache: ExportCacheLike,
  options?: ResolveMissingCoordsBatchOptions,
): Promise<ResolveMissingCoordsBatchResult> {
  const resolver = resolveApiResolver(options);
  const maxUrls = options?.maxUrls ?? DEFAULT_BATCH_MAX_URLS;
  const timeBudgetMs = options?.timeBudgetMs ?? DEFAULT_BATCH_TIME_BUDGET_MS;
  const startedAt = Date.now();

  applySyncCoordsPass(cache);

  const contextsMap = urlLookupContextsForCache(cache);
  const pendingUrls = [...contextsMap.keys()];
  const urlsTotal = options?.urlsTotal ?? pendingUrls.length;
  const placesTotal =
    options?.placesTotal ??
    countPlacesNeedingCoords(cache) + countPlacesWithCoords(cache);
  const urlsDoneOffset =
    options?.urlsDoneOffset ?? urlsTotal - pendingUrls.length;

  if (pendingUrls.length === 0) {
    return {
      cache,
      urlsProcessed: 0,
      urlsDone: urlsDoneOffset,
      urlsTotal,
      urlsRemaining: 0,
      placesResolved: countPlacesWithCoords(cache),
      placesTotal,
      complete: true,
      placesLookupKeyIssue: resolver.getPlacesLookupKeyIssue(),
    };
  }

  const batchUrls = pendingUrls.slice(0, maxUrls);
  const batchContexts = batchUrls.map((url) => contextsMap.get(url)!);
  const urlCoords = new Map<string, Coords | null>();

  if (Date.now() - startedAt < timeBudgetMs) {
    const batchResults = await resolver.resolveUrlsBatch(batchContexts, {
      timeBudgetMs: Math.max(0, timeBudgetMs - (Date.now() - startedAt)),
    });
    for (const [url, coords] of batchResults) {
      urlCoords.set(url, coords);
      markUrlLookupAttempted(cache, url);
    }
  }

  const urlsProcessed = batchContexts.filter((ctx) =>
    urlCoords.has(ctx.url),
  ).length;
  const urlsDone = urlsDoneOffset + urlsProcessed;
  await options?.onProgress?.({
    done: urlsDone,
    total: urlsTotal,
    resolved: countPlacesWithCoords(cache),
    phase: progressPhase(urlsDone, urlsTotal, countPlacesWithCoords(cache)),
  });

  for (const place of collectCachedPlaces(cache)) {
    if (placeHasCoords(place)) continue;
    const coords = urlCoords.get(place.googleMapsUrl) ?? null;
    if (coords) {
      place.lat = coords.lat;
      place.lng = coords.lng;
    }
  }

  const urlsRemaining = countUniqueUrlsNeedingCoords(cache);
  const urlsDoneFinal = urlsTotal - urlsRemaining;

  return {
    cache,
    urlsProcessed,
    urlsDone: urlsDoneFinal,
    urlsTotal,
    urlsRemaining,
    placesResolved: countPlacesWithCoords(cache),
    placesTotal,
    complete: urlsRemaining === 0,
    placesLookupKeyIssue: resolver.getPlacesLookupKeyIssue(),
  };
}

/** Resolves all missing coordinates (for tests). */
export async function resolveMissingCoordsInCache(
  cache: ExportCacheLike,
  options?: ResolveMissingCoordsOptions,
): Promise<ExportCacheLike> {
  let urlsTotal = countUniqueUrlsNeedingCoords(cache);
  let urlsDoneOffset = 0;
  const placesTotal =
    countPlacesNeedingCoords(cache) + countPlacesWithCoords(cache);

  while (true) {
    const result = await resolveMissingCoordsInCacheBatch(cache, {
      ...options,
      urlsTotal,
      urlsDoneOffset,
      placesTotal,
      maxUrls: Number.MAX_SAFE_INTEGER,
      timeBudgetMs: Number.MAX_SAFE_INTEGER,
    });
    cache = result.cache;
    if (result.complete) return cache;
    urlsTotal = result.urlsTotal;
    urlsDoneOffset = result.urlsDone;
  }
}

/** @deprecated HTML scraping is unreliable; kept for regression tests only. */
export function extractCoordsFromMapsHtml(text: string): Coords | null {
  const embedded = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (embedded) {
    const lat = Number(embedded[1]);
    const lng = Number(embedded[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  const atPath = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atPath) {
    const lat = Number(atPath[1]);
    const lng = Number(atPath[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  return null;
}

export type ResolveCoordsFromUrl = (url: string) => Promise<Coords | null>;
