import type { Coords } from "../coords.ts";
import {
  coordsFromGoogleMapsUrl,
  extractLocationFromGoogleMapsUrl,
  extractTitleFromGoogleMapsUrl,
  isGoogleMapsPlaceUrl,
  normalizeGoogleMapsPlaceKey,
} from "./google-maps-url.ts";
import type { ExtractedMapLocation } from "./types.ts";

export type { ExtractedMapLocation };

/** Lat/lng embedded in a map share URL (no network). */
export function coordsFromMapShareUrl(url: string): Coords | null {
  return coordsFromGoogleMapsUrl(url);
}

/** Best-effort location (coords + label) from a map share URL. */
export function extractLocationFromMapShareUrl(
  url: URL | string,
): ExtractedMapLocation | null {
  return extractLocationFromGoogleMapsUrl(url);
}

/** Place name embedded in a map share URL path or query. */
export function extractTitleFromMapShareUrl(url: URL | string): string | null {
  return extractTitleFromGoogleMapsUrl(url);
}

export function isMapShareUrl(url: string): boolean {
  return isGoogleMapsPlaceUrl(url);
}

/** Stable dedup key from a map place share URL. */
export function normalizeMapPlaceKey(url: string): string {
  return normalizeGoogleMapsPlaceKey(url);
}
