import type { Coords, MapBbox } from "../coords.ts";

export type { Coords, MapBbox };

/** Address / place fields from a reverse-geocode snapshot (provider-agnostic shape). */
export type GeocodeProperties = {
  name?: string;
  street?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  type?: string;
  extent?: number[];
  osm_key?: string;
  osm_value?: string;
};

/** One row from forward place search (browser). */
export type PlaceSearchResult = {
  id: string;
  /** Best short label for the list row (ties to the search query when possible). */
  primaryName: string;
  /** Full address / place line (detail). */
  fullLabel: string;
  lat: number;
  lng: number;
  bbox?: MapBbox;
  /** e.g. City, Province, Landmark — from Photon/OSM type metadata. */
  categoryLabel?: string;
};

export type ReverseGeocodeDetails = {
  fullLabel: string | null;
  shortTitle: string | null;
};

export type ReverseGeocodeResult = {
  source: string;
  lat: number;
  lng: number;
  fetchedAt: string;
  properties: GeocodeProperties;
};

export interface ForwardGeocoder {
  readonly id: string;
  geocodeText(
    text: string,
    ctx?: { collectionName?: string; note?: string | null },
  ): Promise<Coords | null>;
  geocodeTextBatch?(
    texts: readonly string[],
    opts?: { timeBudgetMs?: number; pollMs?: number; maxAttempts?: number },
  ): Promise<(Coords | null)[]>;
}

export interface ReverseGeocoder {
  readonly id: string;
  reverse(
    lat: number,
    lng: number,
    opts?: { lang?: string },
  ): Promise<ReverseGeocodeResult | null>;
}

/** Credentials for server-side coordinate resolution from map share URLs. */
export type CoordResolverConfig = {
  /** Primary place lookup API key (server-side). */
  placesLookupApiKey?: string;
  /** Fallback forward geocoder when place lookup is unavailable. */
  forwardGeocodeApiKey?: string;
};

export type CoordResolver = {
  resolveUrl: (context: UrlLookupContext) => Promise<Coords | null>;
  resolveUrlsBatch: (
    contexts: readonly UrlLookupContext[],
    options?: { timeBudgetMs?: number },
  ) => Promise<Map<string, Coords | null>>;
  getPlacesLookupKeyIssue: () => string | null;
};

export type UrlLookupContext = {
  url: string;
  title: string;
  collectionName?: string;
  note?: string | null;
};

export type ExtractedMapLocation = {
  lat: number;
  lng: number;
  label?: string | null;
  source: string;
};
