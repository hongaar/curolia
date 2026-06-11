/** Client refetch guard when revisiting a pin detail page. */
export const WIKIDATA_SYNC_STALE_TIME_MS = 60_000;

/** Search radius passed to Wikidata `wikibase:around` (kilometers). */
export const WIKIDATA_SEARCH_RADIUS_KM = 0.5;

/**
 * Max distance (meters) for a nearby article to be offered as a pin-detail
 * suggestion. Tighter than the lookup radius so only "very close" landmarks are
 * proposed.
 */
export const WIKIDATA_SUGGESTION_MAX_DISTANCE_M = 250;

/** How long suggestion lookups stay fresh before refetch (ms). */
export const WIKIDATA_SUGGESTION_STALE_TIME_MS = 5 * 60 * 1000;

/** Max landmarks returned for the pin editor picker (sorted by distance). */
export const WIKIDATA_NEARBY_CANDIDATES_LIMIT = 15;

/** SPARQL row cap before dedupe (same place matches many types). */
export const WIKIDATA_SPARQL_ROW_LIMIT = 100;

/** Keep in sync with `packages/plugins/wikidata/supabase/functions/wikidata/index.ts`. */
export const WIKIDATA_AUTO_SYNC_CANDIDATES_LIMIT = 5;

/** Minimum characters before calling Wikipedia search. */
export const WIKIDATA_SEARCH_MIN_CHARS = 2;

/** Debounce delay for search input (ms). */
export const WIKIDATA_SEARCH_DEBOUNCE_MS = 300;

/** Max articles returned for manual Wikipedia search. */
export const WIKIDATA_SEARCH_RESULTS_LIMIT = 10;
