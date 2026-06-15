import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { AsyncLruCache } from "./lib/_services/lru-cache.ts";

/** Keep in sync with `packages/plugins/poi/src/constants.ts`. */
const NEARBY_RADIUS_M = 40;
/** Text search bias radius — wider than nearby list; see POI_TEXT_SEARCH_RADIUS_M. */
const TEXT_SEARCH_RADIUS_M = 5000;
const SEARCH_MIN_CHARS = 2;
const SEARCH_RESULTS_LIMIT = 10;
const NEARBY_CANDIDATES_LIMIT = 15;
const COORD_EPSILON = 0.0001;
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PLUGIN_TYPE_ID = "poi";
const SYNC_EVENT_PIN_COORDINATES_CHANGED = "pin_coordinates_changed";
const PLUGIN_SYNC_DISPATCH_SECRET_ENV = "PLUGIN_SYNC_DISPATCH_SECRET";

/** Nearby list: overpass-api.de first, then community mirrors. */
const OVERPASS_ENDPOINTS_LIST = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;
/** Auto-sync jobs: list mirrors first, then public fallbacks. */
const OVERPASS_ENDPOINTS_SYNC = [
  ...OVERPASS_ENDPOINTS_LIST,
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
] as const;
const OVERPASS_QUERY_TIMEOUT_FULL_S = 30;
const OVERPASS_QUERY_TIMEOUT_LITE_S = 30;
const OVERPASS_FETCH_TIMEOUT_LIST_MS = 30_000;
const OVERPASS_FETCH_TIMEOUT_SYNC_MS = 30_000;
const OVERPASS_ELEMENT_FETCH_TIMEOUT_MS = 30_000;
const OVERPASS_RETRY_STATUSES = new Set([429, 502, 503, 504]);
const POI_TAG_KEYS_FULL = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "man_made",
  "historic",
] as const;
const POI_TAG_KEYS_LITE = ["amenity", "shop", "tourism"] as const;
const USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; plugin-poi)";

// ---------------------------------------------------------------------------
// Geoapify Places API
// ---------------------------------------------------------------------------
const GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places";
const GEOAPIFY_FETCH_TIMEOUT_MS = 15_000;

/**
 * Geoapify Places API — two requests max (see README § Geoapify Places).
 *
 * 1. **Destinations** — food, shops, services, etc. (no `tourism`).
 * 2. **Tourism** — sights/artwork; merged only after destination slots fill.
 *
 * Do not combine everything in one `categories=` call: ranking skews toward
 * tourism artwork in city centres, and `healthcare` zeroes out many mixes.
 * `healthcare` stays disabled until it can get its own request without
 * blowing the two-call budget.
 */
const GEOAPIFY_DESTINATION_CATEGORIES = [
  "commercial",
  "catering",
  "education",
  "childcare",
  "camping",
  "entertainment",
  "heritage",
  "religion",
  "rental",
  "service",
  "amenity",
] as const;

const GEOAPIFY_TOURISM_CATEGORIES = ["tourism"] as const;

type GeoapifyFeature = {
  type: string;
  properties: {
    name?: string;
    categories?: string[];
    distance?: number;
    lat?: number;
    lon?: number;
    datasource?: {
      sourcename?: string;
      raw?: Record<string, unknown>;
    };
    place_id?: string;
    website?: string;
    opening_hours?: string;
    contact?: { phone?: string; email?: string };
    [k: string]: unknown;
  };
};

type GeoapifyResponse = {
  type: string;
  features: GeoapifyFeature[];
};

function geoapifyOsmType(
  raw: Record<string, unknown>,
): "node" | "way" | "relation" {
  const t = String(raw.osm_type ?? "N").toUpperCase();
  if (t === "W" || t === "WAY") return "way";
  if (t === "R" || t === "RELATION") return "relation";
  return "node";
}

function geoapifyOsmId(raw: Record<string, unknown>): number {
  const id = raw.osm_id;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : 0;
}

function tagsFromGeoapifyRaw(
  raw: Record<string, unknown>,
): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "osm_id" || key === "osm_type") continue;
    if (typeof value === "string") tags[key] = value;
    else if (typeof value === "number" || typeof value === "boolean")
      tags[key] = String(value);
  }
  return tags;
}

const GEOAPIFY_ENTERTAINMENT_TOURISM = new Set([
  "museum",
  "zoo",
  "aquarium",
  "theme_park",
]);

function applyGeoapifyCategory(
  cat: string,
  tags: Record<string, string>,
): void {
  const parts = cat.split(".");
  const top = parts[0];
  const leaf = parts[parts.length - 1]!;
  switch (top) {
    case "catering":
    case "childcare":
    case "education":
    case "activity":
    case "service":
    case "production":
    case "amenity":
    case "pet":
      tags.amenity = leaf;
      break;
    case "accommodation":
    case "camping":
      tags.tourism = leaf;
      break;
    case "tourism":
      tags.tourism = leaf;
      break;
    case "leisure":
      tags.leisure = leaf;
      break;
    case "commercial":
      tags.shop = leaf;
      break;
    case "healthcare":
      tags.healthcare = leaf;
      break;
    case "entertainment":
      if (GEOAPIFY_ENTERTAINMENT_TOURISM.has(leaf)) tags.tourism = leaf;
      else tags.leisure = leaf;
      break;
    case "heritage":
    case "memorial":
      tags.historic = leaf;
      break;
    case "religion":
      tags.amenity = "place_of_worship";
      break;
    case "sport":
      tags.leisure = leaf;
      break;
    case "public_transport":
      tags.amenity = leaf;
      break;
    case "airport":
      tags.aeroway = leaf === "airport" ? "aerodrome" : leaf;
      break;
    case "rental":
      tags.amenity = leaf === "rental" ? "rental" : `${leaf}_rental`;
      break;
    case "maritime":
      tags.leisure = leaf;
      break;
    case "man_made":
      tags.man_made = leaf;
      break;
    case "ski":
      tags.aerialway = leaf;
      break;
    case "natural":
      tags.natural = leaf;
      break;
    case "beach":
      tags.natural = "beach";
      break;
    case "national_park":
      tags.leisure = "nature_reserve";
      break;
    case "office":
      tags.office = leaf;
      break;
    default:
      break;
  }
}

function tagsFromGeoapifyFeature(
  feat: GeoapifyFeature,
): Record<string, string> {
  const raw = feat.properties.datasource?.raw;
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return tagsFromGeoapifyRaw(raw);
  }
  // Fallback: synthesize pseudo-tags from top-level properties
  const tags: Record<string, string> = {};
  if (feat.properties.name) tags.name = feat.properties.name;
  if (feat.properties.website) tags.website = feat.properties.website;
  if (feat.properties.opening_hours)
    tags.opening_hours = feat.properties.opening_hours;
  if (feat.properties.contact?.phone)
    tags.phone = feat.properties.contact.phone;
  if (feat.properties.contact?.email)
    tags.email = feat.properties.contact.email;
  const cats = [...(feat.properties.categories ?? [])].sort(
    (a, b) => b.split(".").length - a.split(".").length,
  );
  for (const cat of cats) {
    applyGeoapifyCategory(cat, tags);
  }
  return tags;
}

function candidateFromGeoapifyFeature(
  lat: number,
  lng: number,
  feat: GeoapifyFeature,
): PoiNearbyCandidate | null {
  const raw = feat.properties.datasource?.raw;
  const osmType = raw ? geoapifyOsmType(raw) : "node";
  const osmId = raw ? geoapifyOsmId(raw) : 0;
  const tags = tagsFromGeoapifyFeature(feat);
  if (!hasPoiTags(tags) && !feat.properties.name) return null;
  if (!isUsefulPoiCandidate(tags)) return null;
  const fLat = feat.properties.lat;
  const fLng = feat.properties.lon;
  const distanceM =
    typeof feat.properties.distance === "number"
      ? Math.round(feat.properties.distance)
      : typeof fLat === "number" && typeof fLng === "number"
        ? Math.round(haversineM(lat, lng, fLat, fLng))
        : 0;
  if (distanceM > NEARBY_RADIUS_M) return null;
  return {
    osmType,
    osmId,
    name: tags.name?.trim() || feat.properties.name?.trim() || null,
    placeType: primaryPoiLabel(tags),
    distanceM,
    tags,
  };
}

function geoapifyFeaturesToCandidates(
  lat: number,
  lng: number,
  features: GeoapifyFeature[],
  maxDistanceM: number,
): PoiNearbyCandidate[] {
  const candidates: PoiNearbyCandidate[] = [];
  for (const feat of features) {
    const c = candidateFromGeoapifyFeature(lat, lng, feat);
    if (!c || c.distanceM > maxDistanceM) continue;
    candidates.push(c);
  }
  candidates.sort((a, b) => a.distanceM - b.distanceM);
  return filterUsefulCandidates(candidates);
}

/** One Places request; callers batch at most two category groups. */
async function fetchGeoapifyPlacesRaw(
  apiKey: string,
  params: Record<string, string>,
): Promise<GeoapifyFeature[]> {
  const searchParams = new URLSearchParams({ ...params, apiKey });
  const res = await fetch(`${GEOAPIFY_PLACES_URL}?${searchParams}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(GEOAPIFY_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`geoapify_http_${res.status}`);
  }
  const body = (await res.json()) as GeoapifyResponse;
  return body.features ?? [];
}

type GeoapifyPlacesQuery = {
  lat: number;
  lng: number;
  apiKey: string;
  radiusM: number;
  limit: number;
  extraParams?: Record<string, string>;
};

async function fetchGeoapifyDestinationFeatures(
  query: GeoapifyPlacesQuery,
): Promise<GeoapifyFeature[]> {
  return fetchGeoapifyPlacesRaw(query.apiKey, {
    categories: GEOAPIFY_DESTINATION_CATEGORIES.join(","),
    filter: `circle:${query.lng},${query.lat},${query.radiusM}`,
    bias: `proximity:${query.lng},${query.lat}`,
    limit: String(query.limit),
    ...query.extraParams,
  });
}

async function fetchGeoapifyTourismFeatures(
  query: GeoapifyPlacesQuery,
): Promise<GeoapifyFeature[]> {
  return fetchGeoapifyPlacesRaw(query.apiKey, {
    categories: GEOAPIFY_TOURISM_CATEGORIES.join(","),
    filter: `circle:${query.lng},${query.lat},${query.radiusM}`,
    bias: `proximity:${query.lng},${query.lat}`,
    limit: String(query.limit),
    ...query.extraParams,
  });
}

/** Destinations first, then tourism — avoids artwork filling the nearby list. */
function mergeGeoapifyCandidates(
  lat: number,
  lng: number,
  destinationFeatures: GeoapifyFeature[],
  tourismFeatures: GeoapifyFeature[],
  radiusM: number,
  limit: number,
): PoiNearbyCandidate[] {
  const primary = geoapifyFeaturesToCandidates(
    lat,
    lng,
    destinationFeatures,
    radiusM,
  );
  const out = finalizeNearbyCandidates(primary, limit);
  if (out.length >= limit) return out;

  const seen = new Set(out.map((c) => `${c.osmType}/${c.osmId}`));
  const secondary = geoapifyFeaturesToCandidates(
    lat,
    lng,
    tourismFeatures,
    radiusM,
  );
  for (const candidate of secondary) {
    const key = `${candidate.osmType}/${candidate.osmId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
    if (out.length >= limit) break;
  }
  return out;
}

async function fetchGeoapifyPlaces(
  lat: number,
  lng: number,
  apiKey: string,
  limit = NEARBY_CANDIDATES_LIMIT,
): Promise<PoiNearbyCandidate[]> {
  const query: GeoapifyPlacesQuery = {
    lat,
    lng,
    apiKey,
    radiusM: NEARBY_RADIUS_M,
    limit,
  };
  const [destinations, tourism] = await Promise.all([
    fetchGeoapifyDestinationFeatures(query),
    fetchGeoapifyTourismFeatures(query),
  ]);
  return mergeGeoapifyCandidates(
    lat,
    lng,
    destinations,
    tourism,
    NEARBY_RADIUS_M,
    limit,
  );
}

type NominatimSearchResult = {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  /** Legacy `format=json` field. */
  class?: string;
  /** `format=jsonv2` field (same meaning as `class`). */
  category?: string;
  type?: string;
  display_name?: string;
  name?: string;
  extratags?: Record<string, string>;
};

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_FETCH_TIMEOUT_MS = 15_000;
const NOMINATIM_SEARCH_CACHE_SIZE = 64;
const nominatimSearchCache = new AsyncLruCache<string, PoiNearbyCandidate[]>({
  maxSize: NOMINATIM_SEARCH_CACHE_SIZE,
});

function nominatimSearchCacheKey(
  query: string,
  lat: number,
  lng: number,
): string {
  return `nominatim:v1:${query.trim().toLowerCase()}:${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function nominatimOsmType(
  raw: string | undefined,
): "node" | "way" | "relation" | null {
  const t = raw?.trim().toLowerCase();
  if (t === "node" || t === "way" || t === "relation") return t;
  return null;
}

function tagsFromNominatimResult(
  row: NominatimSearchResult,
): Record<string, string> {
  const tags: Record<string, string> = {};
  const cls = row.class?.trim() || row.category?.trim();
  const type = row.type?.trim();
  if (cls && type) tags[cls] = type;
  const name = row.name?.trim();
  if (name) tags.name = name;
  if (row.extratags && typeof row.extratags === "object") {
    for (const [key, value] of Object.entries(row.extratags)) {
      if (typeof value === "string") tags[key] = value;
    }
  }
  return normalizeTags(tags);
}

function candidateFromNominatimResult(
  pinLat: number,
  pinLng: number,
  row: NominatimSearchResult,
  maxDistanceM: number,
): PoiNearbyCandidate | null {
  const osmType = nominatimOsmType(row.osm_type);
  const osmId = row.osm_id;
  if (!osmType || typeof osmId !== "number" || !Number.isFinite(osmId)) {
    return null;
  }
  const lat = Number(row.lat);
  const lng = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const distanceM = Math.round(haversineM(pinLat, pinLng, lat, lng));
  if (distanceM > maxDistanceM) return null;
  const tags = tagsFromNominatimResult(row);
  if (!hasPoiTags(tags)) return null;
  if (!isUsefulPoiCandidate(tags)) return null;
  return {
    osmType,
    osmId,
    name: tags.name?.trim() || row.name?.trim() || null,
    placeType: primaryPoiLabel(tags),
    distanceM,
    tags,
  };
}

async function searchNominatimPlacesUncached(
  query: string,
  lat: number,
  lng: number,
  limit = SEARCH_RESULTS_LIMIT,
): Promise<PoiNearbyCandidate[]> {
  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit * 3));
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("extratags", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(NOMINATIM_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`nominatim_http_${res.status}`);
  }
  const rows = (await res.json()) as NominatimSearchResult[];
  if (!Array.isArray(rows)) {
    throw new Error("nominatim_invalid_json");
  }

  const candidates: PoiNearbyCandidate[] = [];
  for (const row of rows) {
    const c = candidateFromNominatimResult(lat, lng, row, TEXT_SEARCH_RADIUS_M);
    if (c) candidates.push(c);
  }
  candidates.sort((a, b) => a.distanceM - b.distanceM);
  return finalizeNearbyCandidates(candidates, limit);
}

async function searchNominatimPlaces(
  query: string,
  lat: number,
  lng: number,
  limit = SEARCH_RESULTS_LIMIT,
): Promise<PoiNearbyCandidate[]> {
  return nominatimSearchCache.getOrFetch(
    nominatimSearchCacheKey(query, lat, lng),
    () => searchNominatimPlacesUncached(query, lat, lng, limit),
  );
}

async function searchPoiPlaces(
  query: string,
  lat: number,
  lng: number,
  limit = SEARCH_RESULTS_LIMIT,
): Promise<PoiNearbyCandidate[]> {
  // Single Nominatim request — Geoapify Places `name=` needs the same two-batch
  // split as nearby and still fans out; Nominatim is fast and results are
  // clipped to TEXT_SEARCH_RADIUS_M below.
  return searchNominatimPlaces(query, lat, lng, limit);
}

function getGeoapifyApiKey(): string | null {
  const key = Deno.env.get("GEOAPIFY_API_KEY")?.trim();
  return key || null;
}

type PoiPinPayload = {
  schemaVersion: 1;
  lat: number;
  lng: number;
  fetchedAt: string;
  noPoi?: boolean;
  osmType?: "node" | "way" | "relation";
  osmId?: number;
  distanceM?: number;
  tags?: Record<string, string>;
};

type PinRow = {
  id: string;
  map_id: string;
  lat: number | null;
  lng: number | null;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type PoiNearbyCandidate = {
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string | null;
  placeType: string | null;
  distanceM: number;
  tags: Record<string, string>;
};

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function elementCoords(
  el: OverpassElement,
): { lat: number; lng: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  if (
    el.center &&
    typeof el.center.lat === "number" &&
    typeof el.center.lon === "number"
  ) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

function hasPoiTags(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false;
  return Boolean(
    tags.amenity ||
    tags.shop ||
    tags.tourism ||
    tags.leisure ||
    tags.man_made ||
    tags.historic ||
    tags.office ||
    tags.healthcare ||
    tags.craft ||
    tags.natural ||
    tags.aeroway ||
    tags.aerialway,
  );
}

function normalizeTags(
  tags: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!tags) return out;
  for (const [key, value] of Object.entries(tags)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function buildOverpassQuery(
  lat: number,
  lng: number,
  radiusM: number,
  tagKeys: readonly string[],
  timeoutS: number,
): string {
  const around = `around:${radiusM},${lat},${lng}`;
  const selectors = tagKeys
    .map((key) => `  nwr(${around})["${key}"];`)
    .join("\n");
  return `
[out:json][timeout:${timeoutS}];
(
${selectors}
);
out center tags;
`.trim();
}

function isConnectRefusedError(message: string): boolean {
  return /connection refused|tcp connect error/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

function overpassErrorBody(e: unknown): Record<string, unknown> {
  const message = e instanceof Error ? e.message : "overpass_failed";
  const attemptErrors =
    e instanceof Error && "attemptErrors" in e && Array.isArray(e.attemptErrors)
      ? e.attemptErrors
      : undefined;
  return attemptErrors ? { error: message, attemptErrors } : { error: message };
}

function overpassErrorHttpStatus(e: unknown): number {
  const message = e instanceof Error ? e.message : "overpass_failed";
  const match = message.match(/^overpass_http_(\d+)$/);
  if (match) {
    const code = Number(match[1]);
    if (code >= 400 && code < 600) return code;
  }
  return 502;
}

type OverpassFetchMode = "list" | "sync";

const OVERPASS_AROUND_CACHE_SIZE = 128;
const OVERPASS_ELEMENT_CACHE_SIZE = 256;

const overpassAroundCache = new AsyncLruCache<string, OverpassElement[]>({
  maxSize: OVERPASS_AROUND_CACHE_SIZE,
});
const overpassElementCache = new AsyncLruCache<string, OverpassElement | null>({
  maxSize: OVERPASS_ELEMENT_CACHE_SIZE,
});

function overpassCoordCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function overpassAroundCacheKey(
  mode: OverpassFetchMode,
  lat: number,
  lng: number,
): string {
  return `around:v1:${mode}:${overpassCoordCacheKey(lat, lng)}:r${NEARBY_RADIUS_M}`;
}

function overpassElementCacheKey(
  osmType: "node" | "way" | "relation",
  osmId: number,
): string {
  return `element:v1:${osmType}:${osmId}`;
}

async function fetchOverpassElements(
  lat: number,
  lng: number,
  mode: OverpassFetchMode = "sync",
): Promise<OverpassElement[]> {
  return overpassAroundCache.getOrFetch(
    overpassAroundCacheKey(mode, lat, lng),
    () => fetchOverpassElementsUncached(lat, lng, mode),
  );
}

async function fetchOverpassElementsUncached(
  lat: number,
  lng: number,
  mode: OverpassFetchMode = "sync",
): Promise<OverpassElement[]> {
  let lastError = "overpass_failed";
  const attemptErrors: string[] = [];
  const endpoints =
    mode === "list" ? OVERPASS_ENDPOINTS_LIST : OVERPASS_ENDPOINTS_SYNC;
  const fetchTimeoutMs =
    mode === "list"
      ? OVERPASS_FETCH_TIMEOUT_LIST_MS
      : OVERPASS_FETCH_TIMEOUT_SYNC_MS;
  const maxAttempts = mode === "list" ? 1 : 2;
  const queryPlans =
    mode === "list"
      ? ([
          {
            label: "lite",
            tagKeys: POI_TAG_KEYS_LITE,
            timeoutS: OVERPASS_QUERY_TIMEOUT_LITE_S,
          },
        ] as const)
      : ([
          {
            label: "full",
            tagKeys: POI_TAG_KEYS_FULL,
            timeoutS: OVERPASS_QUERY_TIMEOUT_FULL_S,
          },
          {
            label: "lite",
            tagKeys: POI_TAG_KEYS_LITE,
            timeoutS: OVERPASS_QUERY_TIMEOUT_LITE_S,
          },
        ] as const);

  endpointLoop: for (const endpoint of endpoints) {
    for (const plan of queryPlans) {
      const query = buildOverpassQuery(
        lat,
        lng,
        NEARBY_RADIUS_M,
        plan.tagKeys,
        plan.timeoutS,
      );

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": USER_AGENT,
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: AbortSignal.timeout(fetchTimeoutMs),
          });

          if (!res.ok) {
            lastError = `overpass_http_${res.status}`;
            attemptErrors.push(
              `${endpoint}@${plan.label}@${attempt}:http_${res.status}`,
            );
            if (OVERPASS_RETRY_STATUSES.has(res.status) && attempt === 0) {
              await sleep(res.status === 429 ? 1500 : 750);
              continue;
            }
            break;
          }

          const text = await res.text();
          let json: { elements?: OverpassElement[] };
          try {
            json = JSON.parse(text) as { elements?: OverpassElement[] };
          } catch {
            lastError = "overpass_invalid_json";
            attemptErrors.push(
              `${endpoint}@${plan.label}@${attempt}:invalid_json`,
            );
            break;
          }

          return json.elements ?? [];
        } catch (e) {
          lastError =
            e instanceof Error && e.name === "TimeoutError"
              ? "overpass_http_504"
              : e instanceof Error
                ? e.message
                : "overpass_fetch_failed";
          attemptErrors.push(
            `${endpoint}@${plan.label}@${attempt}:${lastError.slice(0, 120)}`,
          );
          if (isConnectRefusedError(lastError)) {
            continue endpointLoop;
          }
          if (attempt === 0) {
            await sleep(500);
            continue;
          }
        }
      }
    }
  }

  console.error("poi overpass exhausted", { attemptErrors, lastError });

  const err = new Error(lastError) as Error & { attemptErrors?: string[] };
  err.attemptErrors = attemptErrors;
  throw err;
}

async function fetchOsmElementById(
  osmType: "node" | "way" | "relation",
  osmId: number,
): Promise<OverpassElement | null> {
  return overpassElementCache.getOrFetch(
    overpassElementCacheKey(osmType, osmId),
    () => fetchOsmElementByIdUncached(osmType, osmId),
  );
}

async function fetchOsmElementByIdUncached(
  osmType: "node" | "way" | "relation",
  osmId: number,
): Promise<OverpassElement | null> {
  const query = `
[out:json][timeout:10];
${osmType}(${osmId});
out center tags;
`.trim();
  let lastError = "overpass_failed";

  for (const endpoint of OVERPASS_ENDPOINTS_LIST) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(OVERPASS_ELEMENT_FETCH_TIMEOUT_MS),
      });
      if (!res.ok) {
        lastError = `overpass_http_${res.status}`;
        continue;
      }
      const json = (await res.json()) as { elements?: OverpassElement[] };
      const el = json.elements?.[0];
      return el ?? null;
    } catch (e) {
      lastError =
        e instanceof Error && e.name === "TimeoutError"
          ? "overpass_http_504"
          : e instanceof Error
            ? e.message
            : "overpass_fetch_failed";
    }
  }

  throw new Error(lastError);
}

function candidateFromElement(
  lat: number,
  lng: number,
  el: OverpassElement,
): PoiNearbyCandidate | null {
  if (!hasPoiTags(el.tags)) return null;
  const coords = elementCoords(el);
  if (!coords) return null;
  const distanceM = haversineM(lat, lng, coords.lat, coords.lng);
  if (distanceM > NEARBY_RADIUS_M) return null;
  const tags = normalizeTags(el.tags);
  if (!isUsefulPoiCandidate(tags)) return null;
  return {
    osmType: el.type,
    osmId: el.id,
    name: tags.name?.trim() || null,
    placeType: primaryPoiLabel(tags),
    distanceM: Math.round(distanceM),
    tags,
  };
}

function finalizeNearbyCandidates(
  candidates: PoiNearbyCandidate[],
  maxResults: number,
): PoiNearbyCandidate[] {
  const seen = new Set<string>();
  const out: PoiNearbyCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.osmType}/${candidate.osmId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
    if (out.length >= maxResults) break;
  }
  return out;
}

async function queryNearbyPois(
  lat: number,
  lng: number,
  limit = NEARBY_CANDIDATES_LIMIT,
  mode: OverpassFetchMode = "sync",
): Promise<PoiNearbyCandidate[]> {
  // Prefer Geoapify when an API key is configured
  const geoapifyKey = getGeoapifyApiKey();
  if (geoapifyKey) {
    return fetchGeoapifyPlaces(lat, lng, geoapifyKey, limit);
  }
  // Fallback to Overpass
  const elements = await fetchOverpassElements(lat, lng, mode);
  const candidates: PoiNearbyCandidate[] = [];

  for (const el of elements) {
    if (!hasPoiTags(el.tags)) continue;
    const coords = elementCoords(el);
    if (!coords) continue;
    const distanceM = haversineM(lat, lng, coords.lat, coords.lng);
    if (distanceM > NEARBY_RADIUS_M) continue;
    const tags = normalizeTags(el.tags);
    const name = tags.name?.trim() || null;
    candidates.push({
      osmType: el.type,
      osmId: el.id,
      name,
      placeType: primaryPoiLabel(tags),
      distanceM: Math.round(distanceM),
      tags,
    });
  }

  candidates.sort((a, b) => a.distanceM - b.distanceM);
  return finalizeNearbyCandidates(filterUsefulCandidates(candidates), limit);
}

function payloadFromCandidate(
  lat: number,
  lng: number,
  candidate: PoiNearbyCandidate,
): PoiPinPayload {
  return {
    schemaVersion: 1,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    osmType: candidate.osmType,
    osmId: candidate.osmId,
    distanceM: candidate.distanceM,
    tags: candidate.tags,
  };
}

async function queryNearestPoi(
  lat: number,
  lng: number,
): Promise<PoiPinPayload | null> {
  const candidates = await queryNearbyPois(lat, lng, NEARBY_CANDIDATES_LIMIT);
  const fetchedAt = new Date().toISOString();
  if (candidates.length === 0) {
    return {
      schemaVersion: 1,
      lat,
      lng,
      fetchedAt,
      noPoi: true,
    };
  }
  return payloadFromCandidate(lat, lng, candidates[0]);
}

/**
 * Return a candidate including tags so the client can optimistically
 * display metadata without a server round-trip.
 */
function publicCandidate(candidate: PoiNearbyCandidate): PoiNearbyCandidate {
  return candidate;
}

function parsePayload(raw: unknown): PoiPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.fetchedAt !== "string") return null;
  return raw as PoiPinPayload;
}

function payloadMatches(
  payload: PoiPinPayload,
  lat: number,
  lng: number,
): boolean {
  if (
    Math.abs(payload.lat - lat) >= COORD_EPSILON ||
    Math.abs(payload.lng - lng) >= COORD_EPSILON
  ) {
    return false;
  }
  const age = Date.now() - new Date(payload.fetchedAt).getTime();
  return age >= 0 && age <= CACHE_MAX_AGE_MS;
}

async function upsertPayload(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  pinId: string,
  payload: PoiPinPayload,
): Promise<void> {
  const { error } = await admin.from("plugin_entity_data").upsert(
    {
      map_id: mapId,
      entity_type: "pin",
      entity_id: pinId,
      plugin_type_id: PLUGIN_TYPE_ID,
      data: payload as unknown as Record<string, unknown>,
    },
    { onConflict: "entity_type,entity_id,plugin_type_id" },
  );
  if (error) throw error;
}

type PinMetadataFieldKey =
  | "phone"
  | "website"
  | "opening_hours"
  | "email"
  | "place_name"
  | "place_type"
  | "cuisine"
  | "wheelchair_access"
  | "dog_policy"
  | "brand"
  | "operator"
  | "dietary_options"
  | "place_categories";

type PinMetadataUpsert = {
  field_key: PinMetadataFieldKey;
  value: Record<string, unknown>;
};

const FOOD_AMENITIES = new Set([
  "restaurant",
  "cafe",
  "fast_food",
  "bar",
  "pub",
  "food_court",
  "ice_cream",
  "bakery",
  "biergarten",
  "bbq",
  "nightclub",
  "canteen",
]);
const FOOD_SHOPS = new Set([
  "bakery",
  "butcher",
  "confectionery",
  "deli",
  "greengrocer",
  "seafood",
  "wine",
  "alcohol",
  "cheese",
  "chocolate",
]);
const OUTDOOR_TOURISM = new Set([
  "camp_site",
  "caravan_site",
  "picnic_site",
  "viewpoint",
  "wilderness_hut",
  "alpine_hut",
  "hostel",
  "hotel",
  "motel",
  "guest_hut",
]);
const OUTDOOR_AMENITIES = new Set([
  "fuel",
  "sanitary_dump_station",
  "charging_station",
  "bicycle_rental",
  "toilets",
]);
const OUTDOOR_LEISURE = new Set([
  "park",
  "playground",
  "nature_reserve",
  "marina",
  "pitch",
  "track",
  "slipway",
  "garden",
  "common",
  "recreation_ground",
  "dog_park",
  "beach_resort",
]);
const NOISE_AMENITIES = new Set([
  "charging_station",
  "bicycle_parking",
  "parking",
  "parking_space",
  "waste_disposal",
  "waste_basket",
  "toilets",
  "drinking_water",
  "bench",
  "shelter",
  "grit_bin",
  "recycling",
  "vending_machine",
  "clock",
  "fountain",
  "give_box",
  "letter_box",
  "post_box",
  "bus_stop",
  "taxi",
  "car_sharing",
  "motorcycle_parking",
  "bicycle_repair_station",
  "sanitary_dump_station",
  "bicycle_rental",
]);
const NOISE_TOURISM = new Set([
  "picnic_site",
  "viewpoint",
  "wilderness_hut",
  "alpine_hut",
  "guest_hut",
  "information",
  "yes",
]);
const USEFUL_LEISURE = new Set([
  "swimming_pool",
  "fitness_centre",
  "sports_centre",
  "stadium",
  "water_park",
  "bowling_alley",
  "ice_rink",
  "sauna",
  "spa",
  "hackerspace",
  "arts_centre",
  "dance",
  "miniature_golf",
  "amusement_arcade",
  "escape_game",
  "trampoline_park",
]);
const PRIMARY_TYPE_KEYS = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "man_made",
  "historic",
  "office",
  "healthcare",
  "craft",
  "natural",
  "aeroway",
  "aerialway",
];
function formatOpeningHoursDisplay(raw: string): string {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

function normalizePhoneTel(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits || digits === "+") return null;
  return digits;
}

function firstTag(tags: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return null;
}

function titleCaseToken(token: string): string {
  const t = token.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function formatTagValue(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

function formatCuisine(value: string): string {
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .split(/[_\s]+/)
        .filter(Boolean)
        .map(titleCaseToken)
        .join(" "),
    )
    .join(", ");
}

function primaryPoiLabel(tags: Record<string, string>): string | null {
  for (const key of PRIMARY_TYPE_KEYS) {
    const value = tags[key]?.trim();
    if (value) return formatTagValue(value);
  }
  return null;
}

function isFoodPoi(tags: Record<string, string>): boolean {
  const amenity = tags.amenity;
  if (amenity && FOOD_AMENITIES.has(amenity)) return true;
  const shop = tags.shop;
  if (shop && FOOD_SHOPS.has(shop)) return true;
  return Boolean(tags.cuisine?.trim());
}

function isOutdoorPoi(tags: Record<string, string>): boolean {
  const tourism = tags.tourism;
  if (tourism && OUTDOOR_TOURISM.has(tourism)) return true;
  const amenity = tags.amenity;
  if (amenity && OUTDOOR_AMENITIES.has(amenity)) return true;
  const leisure = tags.leisure;
  if (leisure && OUTDOOR_LEISURE.has(leisure)) return true;
  return false;
}

/** Keep in sync with `packages/plugins/poi/src/poi-format.ts`. */
function isUsefulPoiCandidate(tags: Record<string, string>): boolean {
  if (tags.natural) return false;
  if (tags.man_made) return false;
  if (tags.aerialway || tags.aeroway) return false;
  if (tags.boundary === "national_park") return false;

  const amenity = tags.amenity?.trim();
  if (amenity) {
    if (NOISE_AMENITIES.has(amenity)) return false;
    return true;
  }

  if (tags.shop?.trim()) return true;

  const tourism = tags.tourism?.trim();
  if (tourism) {
    if (NOISE_TOURISM.has(tourism)) return false;
    return true;
  }

  const leisure = tags.leisure?.trim();
  if (leisure) {
    if (OUTDOOR_LEISURE.has(leisure)) return false;
    if (USEFUL_LEISURE.has(leisure)) return true;
    return false;
  }

  if (tags.historic?.trim()) return true;
  if (tags.healthcare?.trim()) return true;
  if (tags.craft?.trim()) return true;
  if (tags.office?.trim()) return true;

  return false;
}

function filterUsefulCandidates(
  candidates: PoiNearbyCandidate[],
): PoiNearbyCandidate[] {
  return candidates.filter((candidate) => isUsefulPoiCandidate(candidate.tags));
}

function parseWheelchairLevel(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "designated" || v === "limited" || v === "no")
    return v;
  return null;
}

function parseDogLevel(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "leashed" || v === "no") return v;
  return null;
}

function dietaryLabelsFromTags(tags: Record<string, string>): string[] {
  const labels: string[] = [];
  for (const [key, raw] of Object.entries(tags)) {
    if (!key.startsWith("diet:")) continue;
    const value = raw.trim().toLowerCase();
    if (value !== "yes" && value !== "only") continue;
    const slug = key.slice(5);
    if (!slug) continue;
    const label = formatTagValue(slug);
    labels.push(value === "only" ? `${label} only` : label);
  }
  return labels;
}

/** Keep in sync with `packages/plugins/poi/src/poi-pin-metadata.ts`. */
function pinMetadataFromOsmTags(
  tags: Record<string, string>,
): PinMetadataUpsert[] {
  const fields: PinMetadataUpsert[] = [];

  const placeType = primaryPoiLabel(tags);
  if (placeType)
    fields.push({ field_key: "place_type", value: { label: placeType } });

  const cuisineRaw = tags.cuisine?.trim();
  if (cuisineRaw) {
    fields.push({
      field_key: "cuisine",
      value: { label: formatCuisine(cuisineRaw) },
    });
  }

  const dietary = dietaryLabelsFromTags(tags);
  if (dietary.length > 0) {
    fields.push({ field_key: "dietary_options", value: { labels: dietary } });
  }

  const wheelchair = parseWheelchairLevel(tags.wheelchair);
  if (wheelchair) {
    fields.push({
      field_key: "wheelchair_access",
      value: { level: wheelchair },
    });
  }

  const dog = parseDogLevel(tags.dog);
  if (dog) fields.push({ field_key: "dog_policy", value: { level: dog } });

  const phoneRaw = firstTag(tags, [
    "phone",
    "contact:phone",
    "contact:mobile",
    "mobile",
  ]);
  if (phoneRaw) {
    const tel = normalizePhoneTel(phoneRaw);
    if (tel) {
      fields.push({
        field_key: "phone",
        value: { tel, ...(phoneRaw !== tel ? { display: phoneRaw } : {}) },
      });
    }
  }

  const websiteRaw = firstTag(tags, [
    "website",
    "contact:website",
    "url",
    "contact:url",
  ]);
  if (websiteRaw) {
    const url = normalizeWebsiteUrl(websiteRaw);
    if (url) fields.push({ field_key: "website", value: { url } });
  }

  const emailRaw = firstTag(tags, ["email", "contact:email"]);
  if (emailRaw && emailRaw.includes("@")) {
    fields.push({ field_key: "email", value: { email: emailRaw } });
  }

  const hoursRaw = tags.opening_hours?.trim();
  if (hoursRaw) {
    fields.push({
      field_key: "opening_hours",
      value: { raw: hoursRaw, display: formatOpeningHoursDisplay(hoursRaw) },
    });
  }

  fields.push({
    field_key: "place_categories",
    value: { food: isFoodPoi(tags), outdoor: isOutdoorPoi(tags) },
  });

  return fields;
}

async function replacePinMetadataForSource(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  pinId: string,
  tags: Record<string, string> | null | undefined,
): Promise<void> {
  const { error: deleteErr } = await admin
    .from("pin_metadata")
    .delete()
    .eq("pin_id", pinId)
    .eq("source_plugin_id", PLUGIN_TYPE_ID);
  if (deleteErr) throw deleteErr;

  if (!tags) return;
  const fields = pinMetadataFromOsmTags(tags);
  if (fields.length === 0) return;

  const { error: insertErr } = await admin.from("pin_metadata").insert(
    fields.map((field) => ({
      pin_id: pinId,
      map_id: mapId,
      field_key: field.field_key,
      source_plugin_id: PLUGIN_TYPE_ID,
      value: field.value,
    })),
  );
  if (insertErr) throw insertErr;
}

async function cancelPendingSyncJobsForPin(
  admin: ReturnType<typeof createClient>,
  pinId: string,
): Promise<void> {
  const { error } = await admin
    .from("plugin_sync_jobs")
    .delete()
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .eq("entity_type", "pin")
    .eq("entity_id", pinId)
    .in("status", ["pending", "processing"]);
  if (error) throw error;
}

async function completePendingSyncJobsForPin(
  admin: ReturnType<typeof createClient>,
  pinId: string,
): Promise<void> {
  const { error } = await admin
    .from("plugin_sync_jobs")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .eq("entity_type", "pin")
    .eq("entity_id", pinId)
    .in("status", ["pending", "processing"]);
  if (error) throw error;
}

type PluginSyncJobRow = {
  id: string;
  entity_id: string;
  map_id: string;
  payload: { lat?: number; lng?: number };
  attempts: number;
};

function jobCoordinates(
  job: PluginSyncJobRow,
): { lat: number; lng: number } | null {
  const lat = job.payload?.lat;
  const lng = job.payload?.lng;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }
  return { lat, lng };
}

async function applyPinAutoLookup(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  pinId: string,
  lat: number,
  lng: number,
): Promise<PoiPinPayload> {
  const payload = await queryNearestPoi(lat, lng);
  await upsertPayload(admin, mapId, pinId, payload);
  await replacePinMetadataForSource(
    admin,
    mapId,
    pinId,
    payload.noPoi ? null : payload.tags,
  );
  await completePendingSyncJobsForPin(admin, pinId);
  return payload;
}

async function processSyncJobs(
  admin: ReturnType<typeof createClient>,
  limit: number,
): Promise<Response> {
  const { data: jobs, error } = await admin
    .from("plugin_sync_jobs")
    .select("id, entity_id, map_id, payload, attempts")
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  let processed = 0;
  let failed = 0;

  for (const job of (jobs ?? []) as PluginSyncJobRow[]) {
    await admin
      .from("plugin_sync_jobs")
      .update({
        status: "processing",
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    const coords = jobCoordinates(job);
    if (!coords) {
      await admin
        .from("plugin_sync_jobs")
        .update({
          status: "failed",
          last_error: "invalid_job_payload",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      failed++;
      continue;
    }

    try {
      await applyPinAutoLookup(
        admin,
        job.map_id,
        job.entity_id,
        coords.lat,
        coords.lng,
      );
      await admin
        .from("plugin_sync_jobs")
        .update({
          status: "completed",
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      processed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "sync_failed";
      await admin
        .from("plugin_sync_jobs")
        .update({
          status: "failed",
          last_error: msg.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      failed++;
    }
  }

  return jsonResponse({
    processed,
    failed,
    batchSize: (jobs ?? []).length,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const dispatchSecret =
    Deno.env.get(PLUGIN_SYNC_DISPATCH_SECRET_ENV) ??
    Deno.env.get("POI_DISPATCH_SECRET");

  let body: {
    action?: string;
    pinId?: string;
    osmType?: string;
    osmId?: number;
    tags?: Record<string, string>;
    limit?: number;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (
    body.action === "process_sync_jobs" &&
    dispatchSecret &&
    authHeader === `Bearer ${dispatchSecret}`
  ) {
    const admin = createClient(supabaseUrl, serviceKey);
    const limit = Math.min(
      Math.max(typeof body.limit === "number" ? body.limit : 10, 1),
      50,
    );
    return processSyncJobs(admin, limit);
  }

  const jwt = authHeader.replace(/^Bearer\s+/i, "") ?? "";
  if (!jwt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "invalid_session" }), {
      status: 401,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }
  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceKey);

  async function loadPinForUser(
    pinId: string,
  ): Promise<
    | { ok: true; pin: PinRow }
    | { ok: false; status: number; body: Record<string, unknown> }
  > {
    const { data: pin, error: pinErr } = await admin
      .from("pins")
      .select("id, map_id, lat, lng")
      .eq("id", pinId)
      .maybeSingle();

    if (pinErr) {
      return { ok: false, status: 500, body: { error: pinErr.message } };
    }
    if (!pin) {
      return { ok: false, status: 404, body: { error: "pin_not_found" } };
    }

    const t = pin as PinRow;
    const { data: mem } = await admin
      .from("map_members")
      .select("user_id")
      .eq("map_id", t.map_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!mem) {
      return { ok: false, status: 403, body: { error: "forbidden" } };
    }

    return { ok: true, pin: t };
  }

  async function assertUserPluginEnabled(
    asSkippedReason = false,
  ): Promise<Response | null> {
    const { data: userPlugin } = await admin
      .from("user_plugins")
      .select("enabled")
      .eq("user_id", userId)
      .eq("plugin_type_id", PLUGIN_TYPE_ID)
      .maybeSingle();

    if (!userPlugin?.enabled) {
      const body = asSkippedReason
        ? { skippedReason: "plugin_disabled" }
        : { error: "plugin_disabled" };
      return new Response(JSON.stringify(body), {
        status: asSkippedReason ? 200 : 403,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
    return null;
  }

  async function assertMapAutoLookupEnabled(
    mapId: string,
  ): Promise<Response | null> {
    const { data: mapPlugin, error: mapPluginErr } = await admin
      .from("map_plugins")
      .select("enabled, config")
      .eq("map_id", mapId)
      .eq("plugin_type_id", PLUGIN_TYPE_ID)
      .maybeSingle();

    if (mapPluginErr) {
      return new Response(JSON.stringify({ error: mapPluginErr.message }), {
        status: 500,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const syncEvents = Array.isArray(
      (mapPlugin?.config as Record<string, unknown> | null)?.syncEvents,
    )
      ? ((mapPlugin?.config as Record<string, unknown>).syncEvents as unknown[])
      : [];

    const autoLookupEnabled =
      Boolean(mapPlugin?.enabled) &&
      syncEvents.includes(SYNC_EVENT_PIN_COORDINATES_CHANGED);

    if (!autoLookupEnabled) {
      return new Response(
        JSON.stringify({ skippedReason: "auto_lookup_disabled" }),
        {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    }

    return null;
  }

  if (body.action === "run_pin_auto_lookup") {
    const pinId = body.pinId?.trim();
    if (!pinId) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const loaded = await loadPinForUser(pinId);
    if (!loaded.ok) {
      return new Response(JSON.stringify(loaded.body), {
        status: loaded.status,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const disabled = await assertUserPluginEnabled(true);
    if (disabled) return disabled;

    const autoLookupDisabled = await assertMapAutoLookupEnabled(
      loaded.pin.map_id,
    );
    if (autoLookupDisabled) return autoLookupDisabled;

    const lat = loaded.pin.lat;
    const lng = loaded.pin.lng;
    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return new Response(JSON.stringify({ skippedReason: "no_coordinates" }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const { data: existingRow } = await admin
      .from("plugin_entity_data")
      .select("data")
      .eq("entity_type", "pin")
      .eq("entity_id", loaded.pin.id)
      .eq("plugin_type_id", PLUGIN_TYPE_ID)
      .maybeSingle();

    const cached = parsePayload(existingRow?.data);
    if (cached && payloadMatches(cached, lat, lng)) {
      await completePendingSyncJobsForPin(admin, loaded.pin.id);
      if (cached.noPoi) {
        return new Response(
          JSON.stringify({
            synced: false,
            reason: "nothing_nearby",
            payload: cached,
          }),
          {
            status: 200,
            headers: { ...cors(), "Content-Type": "application/json" },
          },
        );
      }
      return new Response(JSON.stringify({ synced: true, payload: cached }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    try {
      const payload = await applyPinAutoLookup(
        admin,
        loaded.pin.map_id,
        loaded.pin.id,
        lat,
        lng,
      );
      if (payload.noPoi) {
        return new Response(
          JSON.stringify({
            synced: false,
            reason: "nothing_nearby",
            payload,
          }),
          {
            status: 200,
            headers: { ...cors(), "Content-Type": "application/json" },
          },
        );
      }
      return new Response(JSON.stringify({ synced: true, payload }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("poi run_pin_auto_lookup failed", e);
      return jsonResponse(overpassErrorBody(e), overpassErrorHttpStatus(e));
    }
  }

  if (body.action === "search_places") {
    const pinId = body.pinId?.trim();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!pinId || query.length < SEARCH_MIN_CHARS) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const loaded = await loadPinForUser(pinId);
    if (!loaded.ok) {
      return new Response(JSON.stringify(loaded.body), {
        status: loaded.status,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const disabled = await assertUserPluginEnabled();
    if (disabled) return disabled;

    const lat = loaded.pin.lat;
    const lng = loaded.pin.lng;
    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return new Response(JSON.stringify({ error: "no_coordinates" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    try {
      const results = await searchPoiPlaces(query, lat, lng);
      return new Response(
        JSON.stringify({ results: results.map(publicCandidate) }),
        {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    } catch (e) {
      console.error("poi search_places failed", e);
      return jsonResponse(overpassErrorBody(e), overpassErrorHttpStatus(e));
    }
  }

  if (body.action === "list_nearby_candidates") {
    const pinId = body.pinId?.trim();
    if (!pinId) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const loaded = await loadPinForUser(pinId);
    if (!loaded.ok) {
      return new Response(JSON.stringify(loaded.body), {
        status: loaded.status,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const disabled = await assertUserPluginEnabled();
    if (disabled) return disabled;

    const lat = loaded.pin.lat;
    const lng = loaded.pin.lng;
    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return new Response(JSON.stringify({ error: "no_coordinates" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    try {
      const candidates = await queryNearbyPois(
        lat,
        lng,
        NEARBY_CANDIDATES_LIMIT,
        "list",
      );
      return new Response(
        JSON.stringify({ candidates: candidates.map(publicCandidate) }),
        {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    } catch (e) {
      console.error("poi list_nearby_candidates failed", e);
      return jsonResponse(overpassErrorBody(e), overpassErrorHttpStatus(e));
    }
  }

  if (body.action === "set_pin_poi") {
    const pinId = body.pinId?.trim();
    const osmType = body.osmType;
    const osmId = body.osmId;
    if (
      !pinId ||
      (osmType !== "node" && osmType !== "way" && osmType !== "relation") ||
      typeof osmId !== "number" ||
      !Number.isFinite(osmId)
    ) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const loaded = await loadPinForUser(pinId);
    if (!loaded.ok) {
      return new Response(JSON.stringify(loaded.body), {
        status: loaded.status,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const disabled = await assertUserPluginEnabled();
    if (disabled) return disabled;

    const lat = loaded.pin.lat;
    const lng = loaded.pin.lng;
    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return new Response(JSON.stringify({ error: "no_coordinates" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    try {
      let candidate: PoiNearbyCandidate;

      // When the client passes tags from the candidate list, skip the
      // provider round-trip entirely (Geoapify already returned them).
      const clientTags = body.tags;
      if (
        clientTags &&
        typeof clientTags === "object" &&
        Object.keys(clientTags).length > 0
      ) {
        const tags = normalizeTags(clientTags);
        const clientDistanceM =
          typeof body.distanceM === "number" && Number.isFinite(body.distanceM)
            ? Math.round(Math.max(0, body.distanceM))
            : 0;
        candidate = {
          osmType: osmType as "node" | "way" | "relation",
          osmId,
          name: tags.name?.trim() || null,
          placeType: primaryPoiLabel(tags),
          distanceM: clientDistanceM,
          tags,
        };
      } else {
        // Legacy path: fetch element from provider by OSM id
        const el = await fetchOsmElementById(osmType, osmId);
        if (!el) {
          return new Response(JSON.stringify({ error: "poi_not_found" }), {
            status: 400,
            headers: { ...cors(), "Content-Type": "application/json" },
          });
        }
        const c = candidateFromElement(lat, lng, el);
        if (!c) {
          return new Response(JSON.stringify({ error: "poi_not_nearby" }), {
            status: 400,
            headers: { ...cors(), "Content-Type": "application/json" },
          });
        }
        candidate = c;
      }

      const payload = payloadFromCandidate(lat, lng, candidate);
      await upsertPayload(admin, loaded.pin.map_id, loaded.pin.id, payload);
      await replacePinMetadataForSource(
        admin,
        loaded.pin.map_id,
        loaded.pin.id,
        payload.tags,
      );
      await completePendingSyncJobsForPin(admin, loaded.pin.id);

      return new Response(JSON.stringify({ payload }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("poi set_pin_poi failed", e);
      return jsonResponse(overpassErrorBody(e), overpassErrorHttpStatus(e));
    }
  }

  if (body.action === "clear_pin_poi") {
    const pinId = body.pinId?.trim();
    if (!pinId) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const loaded = await loadPinForUser(pinId);
    if (!loaded.ok) {
      return new Response(JSON.stringify(loaded.body), {
        status: loaded.status,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const disabled = await assertUserPluginEnabled();
    if (disabled) return disabled;

    const lat = loaded.pin.lat;
    const lng = loaded.pin.lng;
    const hasCoords =
      lat != null &&
      lng != null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng);

    let clearedPayload: PoiPinPayload | undefined;
    if (hasCoords) {
      // Keep a noPoi marker so map auto-lookup does not immediately re-attach
      // the closest place after the user removes a link.
      clearedPayload = {
        schemaVersion: 1,
        lat,
        lng,
        fetchedAt: new Date().toISOString(),
        noPoi: true,
      };
      const { error: upsertError } = await admin
        .from("plugin_entity_data")
        .upsert(
          {
            map_id: loaded.pin.map_id,
            entity_type: "pin",
            entity_id: loaded.pin.id,
            plugin_type_id: PLUGIN_TYPE_ID,
            data: clearedPayload,
          },
          { onConflict: "entity_type,entity_id,plugin_type_id" },
        );
      if (upsertError) {
        console.error("poi clear_pin_poi upsert failed", upsertError);
        return new Response(JSON.stringify({ error: "clear_failed" }), {
          status: 500,
          headers: { ...cors(), "Content-Type": "application/json" },
        });
      }
    } else {
      await admin
        .from("plugin_entity_data")
        .delete()
        .eq("entity_type", "pin")
        .eq("entity_id", loaded.pin.id)
        .eq("plugin_type_id", PLUGIN_TYPE_ID);
    }

    await admin
      .from("pin_metadata")
      .delete()
      .eq("pin_id", loaded.pin.id)
      .eq("source_plugin_id", PLUGIN_TYPE_ID);

    await cancelPendingSyncJobsForPin(admin, loaded.pin.id);

    return new Response(
      JSON.stringify({
        cleared: true,
        ...(clearedPayload ? { payload: clearedPayload } : {}),
      }),
      {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      },
    );
  }

  if (body.action !== "sync_pin_poi" || !body.pinId) {
    return new Response(JSON.stringify({ error: "invalid_body" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const loaded = await loadPinForUser(body.pinId);
  if (!loaded.ok) {
    return new Response(JSON.stringify(loaded.body), {
      status: loaded.status,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const t = loaded.pin;
  const disabled = await assertUserPluginEnabled(true);
  if (disabled) return disabled;

  const lat = t.lat;
  const lng = t.lng;
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return new Response(JSON.stringify({ skippedReason: "no_coordinates" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const { data: existingJob } = await admin
    .from("plugin_sync_jobs")
    .select("id, status")
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .eq("entity_type", "pin")
    .eq("entity_id", t.id)
    .eq("event", SYNC_EVENT_PIN_COORDINATES_CHANGED)
    .in("status", ["pending", "processing"])
    .maybeSingle();

  if (existingJob) {
    return new Response(
      JSON.stringify({
        enqueued: true,
        jobId: existingJob.id,
        status: existingJob.status,
      }),
      {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      },
    );
  }

  const { data: newJob, error: enqueueErr } = await admin
    .from("plugin_sync_jobs")
    .insert({
      plugin_type_id: PLUGIN_TYPE_ID,
      entity_type: "pin",
      entity_id: t.id,
      map_id: t.map_id,
      event: SYNC_EVENT_PIN_COORDINATES_CHANGED,
      payload: { lat, lng },
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (enqueueErr) {
    return new Response(JSON.stringify({ error: enqueueErr.message }), {
      status: 500,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ enqueued: true, jobId: newJob?.id ?? null }),
    {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    },
  );
});
