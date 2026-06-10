import type { PlaceSearchResult } from "@curolia/services/geocoding";

/** True when a place row matches the query text exactly (primary or full label). */
export function isExactPlaceMatch(
  query: string,
  place: PlaceSearchResult,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const primary = place.primaryName.trim().toLowerCase();
  const full = place.fullLabel.trim().toLowerCase();
  return primary === q || full === q;
}

/** First exact match in search results, if any. */
export function findExactPlaceMatch(
  query: string,
  places: readonly PlaceSearchResult[],
): PlaceSearchResult | null {
  return places.find((place) => isExactPlaceMatch(query, place)) ?? null;
}
