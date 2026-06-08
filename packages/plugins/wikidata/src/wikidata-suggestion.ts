import { WIKIDATA_SUGGESTION_MAX_DISTANCE_M } from "./constants";
import type {
  WikidataDeclinedPayload,
  WikidataNearbyCandidate,
  WikidataPinPayload,
} from "./wikidata-pin-data";
import { wikidataDeclinedPayloadMatches } from "./wikidata-pin-data";

export type WikidataSuggestionInput = {
  /** Wikidata plugin enabled for the account (and implemented). */
  pluginReady: boolean;
  /** Existing enrichment payload attached to the pin, if any. */
  attachedPayload: WikidataPinPayload | null;
  /** Stored decline marker for this pin, if any. */
  declinedPayload: WikidataDeclinedPayload | null;
  /** Pin coords used to decide whether a prior dismiss still applies. */
  pinLat: number;
  pinLng: number;
  /** Nearby candidates returned by the edge function. */
  candidates: WikidataNearbyCandidate[];
};

/** Whether a pin-detail article suggestion should stay hidden at these coords. */
export function wikidataPinSuggestionSuppressed(
  attachedPayload: WikidataPinPayload | null,
  declinedPayload: WikidataDeclinedPayload | null,
  pinLat: number,
  pinLng: number,
): boolean {
  if (attachedPayload) return true;
  if (
    declinedPayload &&
    wikidataDeclinedPayloadMatches(declinedPayload, pinLat, pinLng)
  ) {
    return true;
  }
  return false;
}

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
  if (
    wikidataPinSuggestionSuppressed(
      input.attachedPayload,
      input.declinedPayload,
      input.pinLat,
      input.pinLng,
    )
  ) {
    return null;
  }

  const within = input.candidates
    .filter((c) => c.distanceM <= WIKIDATA_SUGGESTION_MAX_DISTANCE_M)
    .sort((a, b) => a.distanceM - b.distanceM);

  return within[0] ?? null;
}
