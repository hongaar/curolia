/** Client refetch guard when revisiting a pin detail page. */
export const WIKIDATA_SYNC_STALE_TIME_MS = 60_000;

/** Search radius passed to Wikidata `wikibase:around` (kilometers). */
export const WIKIDATA_SEARCH_RADIUS_KM = 0.5;

/** Max landmarks returned for the pin editor picker (sorted by distance). */
export const WIKIDATA_NEARBY_CANDIDATES_LIMIT = 15;

/** SPARQL row cap before dedupe (same place matches many types). */
export const WIKIDATA_SPARQL_ROW_LIMIT = 100;

/** Keep in sync with `packages/plugins/wikidata/supabase/functions/wikidata/index.ts`. */
export const WIKIDATA_AUTO_SYNC_CANDIDATES_LIMIT = 5;
