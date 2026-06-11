import { POI_SUGGESTION_MAX_DISTANCE_M } from "./constants";
import { isUsefulPoiCandidate } from "./poi-format";
import {
  poiPayloadCoordsMatch,
  type PoiNearbyCandidate,
  type PoiPinPayload,
} from "./poi-pin-data";

/** Whether a stored POI payload already links a place to the pin. */
export function poiPinHasAttachedPoi(payload: PoiPinPayload | null): boolean {
  return Boolean(
    payload &&
    !payload.noPoi &&
    payload.osmType &&
    typeof payload.osmId === "number",
  );
}

/** Whether a pin-detail place suggestion should stay hidden at these coords. */
export function poiPinSuggestionSuppressed(
  payload: PoiPinPayload | null,
  lat: number,
  lng: number,
): boolean {
  if (!payload) return false;
  if (poiPinHasAttachedPoi(payload)) return true;
  if (payload.noPoi && poiPayloadCoordsMatch(payload, lat, lng)) return true;
  return false;
}

export type PoiSuggestionInput = {
  /** POI plugin enabled for the account (and implemented). */
  pluginReady: boolean;
  /** Auto-lookup (auto-attach) enabled for this map. */
  autoLookupEnabled: boolean;
  /** Existing POI payload attached to the pin, if any. */
  attachedPayload: PoiPinPayload | null;
  /** Pin coords used to decide whether a prior dismiss still applies. */
  pinLat: number;
  pinLng: number;
  /** Nearby candidates returned by the edge function. */
  candidates: PoiNearbyCandidate[];
};

/**
 * Picks the nearest place worth suggesting for a pin, or returns null when no
 * suggestion should be shown. A suggestion is suppressed when the plugin is not
 * ready, auto-attach is enabled for the map (the backend handles it), a place is
 * already attached, or nothing is within {@link POI_SUGGESTION_MAX_DISTANCE_M}.
 */
export function selectPoiSuggestionCandidate(
  input: PoiSuggestionInput,
): PoiNearbyCandidate | null {
  if (!input.pluginReady) return null;
  if (input.autoLookupEnabled) return null;
  if (
    poiPinSuggestionSuppressed(
      input.attachedPayload,
      input.pinLat,
      input.pinLng,
    )
  ) {
    return null;
  }

  const within = input.candidates
    .filter(
      (c) =>
        c.distanceM <= POI_SUGGESTION_MAX_DISTANCE_M &&
        isUsefulPoiCandidate(c.tags ?? {}),
    )
    .sort((a, b) => a.distanceM - b.distanceM);

  return within[0] ?? null;
}
