import { WIKIDATA_SUGGESTION_MAX_DISTANCE_M } from "./constants";
import type {
  WikidataNearbyCandidate,
  WikidataPinPayload,
} from "./wikidata-pin-data";

export type WikidataSuggestionInput = {
  /** Wikidata plugin enabled for the account (and implemented). */
  pluginReady: boolean;
  /** Existing enrichment payload attached to the pin, if any. */
  attachedPayload: WikidataPinPayload | null;
  /** Nearby candidates returned by the edge function. */
  candidates: WikidataNearbyCandidate[];
};

/**
 * Picks the nearest notable article worth suggesting for a pin, or returns null
 * when no suggestion should be shown. A suggestion is suppressed when the plugin
 * is not ready, an article is already attached, or nothing is within
 * {@link WIKIDATA_SUGGESTION_MAX_DISTANCE_M}.
 */
export function selectWikidataSuggestionCandidate(
  input: WikidataSuggestionInput,
): WikidataNearbyCandidate | null {
  if (!input.pluginReady) return null;
  if (input.attachedPayload) return null;

  const within = input.candidates
    .filter((c) => c.distanceM <= WIKIDATA_SUGGESTION_MAX_DISTANCE_M)
    .sort((a, b) => a.distanceM - b.distanceM);

  return within[0] ?? null;
}
