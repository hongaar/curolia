/** Radius for the nearby-places picker and auto-lookup (meters). */
export const POI_NEARBY_RADIUS_M = 40;

/** @deprecated Use {@link POI_NEARBY_RADIUS_M}. */
export const POI_SEARCH_RADIUS_M = POI_NEARBY_RADIUS_M;

/** Max nearby places returned in the pin editor picker. */
export const POI_NEARBY_CANDIDATES_LIMIT = 15;

/** Re-fetch when cached payload is older than this (ms). */
export const POI_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Max distance (meters) for a nearby place to be offered as a pin-detail
 * suggestion. Matches {@link POI_NEARBY_RADIUS_M} — candidates are already
 * constrained server-side to the same radius.
 */
export const POI_SUGGESTION_MAX_DISTANCE_M = POI_NEARBY_RADIUS_M;

/** Minimum characters before calling place search. */
export const POI_SEARCH_MIN_CHARS = 2;

/** Debounce delay for search input (ms). */
export const POI_SEARCH_DEBOUNCE_MS = 300;

/** Max places returned for manual text search. */
export const POI_SEARCH_RESULTS_LIMIT = 10;

/** Text search bias radius (meters) — results beyond this are excluded. */
export const POI_TEXT_SEARCH_RADIUS_M = 5000;

/** How long suggestion lookups stay fresh before refetch (ms). */
export const POI_SUGGESTION_STALE_TIME_MS = 5 * 60 * 1000;

export const POI_COORD_EPSILON = 0.0001;
