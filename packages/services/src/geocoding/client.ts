import {
  photonDefaultTitleForZoom,
  reversePhotonGeocode,
  reversePhotonPlaceDetails,
  searchPhotonPlaces,
} from "./photon.ts";
import type { PinGeocode } from "./pin-geocode.ts";
import type {
  GeocodeProperties,
  PlaceSearchResult,
  ReverseGeocodeDetails,
} from "./types.ts";

export type { GeocodeProperties, PlaceSearchResult, ReverseGeocodeDetails };

/** Forward place search for browser UI (global search, pickers). */
export async function searchPlaces(
  query: string,
): Promise<PlaceSearchResult[]> {
  return searchPhotonPlaces(query);
}

/** Reverse geocode coordinates for persistence on `pins.geocode`. */
export async function reverseGeocodeForStorage(
  lat: number,
  lng: number,
): Promise<PinGeocode | null> {
  return reversePhotonGeocode(lat, lng);
}

/**
 * Reverse geocode for display: full place line plus a zoom-aware short title.
 */
export async function reverseGeocodeDetails(
  lat: number,
  lng: number,
  zoom?: number,
): Promise<ReverseGeocodeDetails> {
  return reversePhotonPlaceDetails(lat, lng, zoom);
}

/**
 * Default pin title for reverse geocode at a map zoom — avoids street names when
 * the map is zoomed out to country/city scale.
 */
export function defaultPlaceTitleForZoom(
  properties: GeocodeProperties | undefined,
  fullLabel: string,
  zoom: number,
): string {
  return photonDefaultTitleForZoom(properties, fullLabel, zoom);
}
