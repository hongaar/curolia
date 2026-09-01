import { AsyncLruCache } from "./lru-cache.ts";

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

const USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; places-explore)";

const bboxCache = new AsyncLruCache<string, OverpassElement[]>({ maxSize: 64 });

function bboxCacheKey(
  west: number,
  south: number,
  east: number,
  north: number,
  filter: string,
): string {
  return `bbox:${west.toFixed(3)},${south.toFixed(3)},${east.toFixed(3)},${north.toFixed(3)}:${filter}`;
}

export function buildBboxOverpassQuery(
  west: number,
  south: number,
  east: number,
  north: number,
  osmFilter: string,
  limit = 80,
  timeoutSec = 12,
): string {
  return `
[out:json][timeout:${timeoutSec}];
(
  node${osmFilter}(${south},${west},${north},${east});
  way${osmFilter}(${south},${west},${north},${east});
);
out center ${limit};
`.trim();
}

function elementCoords(
  el: OverpassElement,
): { lat: number; lng: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

export function normalizeTags(
  tags: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!tags) return out;
  for (const [k, v] of Object.entries(tags)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export function primaryPoiLabel(tags: Record<string, string>): string {
  return (
    tags.amenity ??
    tags.shop ??
    tags.tourism ??
    tags.leisure ??
    tags.historic ??
    tags.man_made ??
    "place"
  );
}

export function osmSourceRef(
  osmType: "node" | "way" | "relation",
  osmId: number,
): string {
  return `${osmType}/${osmId}`;
}

export function parseOsmSourceRef(
  sourceRef: string,
): { osmType: "node" | "way" | "relation"; osmId: number } | null {
  const match = sourceRef.match(/^(node|way|relation)\/(\d+)$/);
  if (!match) return null;
  return {
    osmType: match[1] as "node" | "way" | "relation",
    osmId: Number(match[2]),
  };
}

export type BboxPlaceCandidate = {
  osmType: "node" | "way" | "relation";
  osmId: number;
  sourceRef: string;
  name: string | null;
  primaryCategory: string;
  categories: string[];
  lat: number;
  lng: number;
  tags: Record<string, string>;
};

export function candidateFromElement(
  el: OverpassElement,
  categoryId: string,
): BboxPlaceCandidate | null {
  const coords = elementCoords(el);
  if (!coords) return null;
  const tags = normalizeTags(el.tags);
  const name = tags.name?.trim() || null;
  const primaryCategory = primaryPoiLabel(tags);
  return {
    osmType: el.type,
    osmId: el.id,
    sourceRef: osmSourceRef(el.type, el.id),
    name,
    primaryCategory,
    categories: [categoryId.replace("poi:", ""), primaryCategory],
    lat: coords.lat,
    lng: coords.lng,
    tags,
  };
}

export async function fetchOverpassBbox(
  west: number,
  south: number,
  east: number,
  north: number,
  osmFilter: string,
  limit = 80,
  timeoutMs = 28_000,
): Promise<OverpassElement[]> {
  const key = bboxCacheKey(west, south, east, north, osmFilter);
  return bboxCache.getOrFetch(key, async () => {
    const query = buildBboxOverpassQuery(
      west,
      south,
      east,
      north,
      osmFilter,
      limit,
      Math.max(8, Math.ceil(timeoutMs / 1000)),
    );
    let lastError = "overpass_failed";
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) {
          lastError = `overpass_http_${res.status}`;
          continue;
        }
        const json = (await res.json()) as { elements?: OverpassElement[] };
        return json.elements ?? [];
      } catch (e) {
        lastError = e instanceof Error ? e.message : "overpass_fetch_failed";
      }
    }
    throw new Error(lastError);
  });
}

export function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const r = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}
