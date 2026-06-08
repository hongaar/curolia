/** Search radius for nearest place (meters). */
export const POI_SEARCH_RADIUS_M = 40;

/** Max nearby places returned in the pin editor picker. */
export const POI_NEARBY_CANDIDATES_LIMIT = 15;

/** Re-fetch when cached payload is older than this (ms). */
export const POI_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Max distance (meters) for a nearby place to be offered as a pin-detail
 * suggestion. Candidates are already constrained to {@link POI_SEARCH_RADIUS_M}
 * server-side, so this is effectively the same "very close" radius.
 */
export const POI_SUGGESTION_MAX_DISTANCE_M = POI_SEARCH_RADIUS_M;

/** How long suggestion lookups stay fresh before refetch (ms). */
export const POI_SUGGESTION_STALE_TIME_MS = 5 * 60 * 1000;

export const POI_COORD_EPSILON = 0.0001;
