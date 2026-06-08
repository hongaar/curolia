/** Declined pin-detail suggestion marker (no article attached). */
export type WikidataDeclinedPayload = {
  schemaVersion: 1;
  lat: number;
  lng: number;
  fetchedAt: string;
  declined: true;
};

/** Shape stored in `plugin_entity_data.data` for `plugin_type_id = wikidata`. */
export type WikidataPinPayload = {
  schemaVersion: 1;
  lat: number;
  lng: number;
  fetchedAt: string;
  wikidataId: string;
  wikipediaTitle: string;
  wikipediaUrl: string;
  label: string;
  extract: string;
  thumbnailUrl: string | null;
  distanceM: number;
  placeType: string | null;
};

/** Nearby landmark row for the pin editor picker. */
export type WikidataNearbyCandidate = {
  wikidataId: string;
  label: string;
  wikipediaTitle: string;
  distanceM: number;
  placeType: string | null;
  thumbnailUrl: string | null;
};

export function formatWikidataDistanceM(distanceM: number): string {
  if (distanceM < 1000) return `${distanceM} m`;
  return `${(distanceM / 1000).toFixed(distanceM < 10_000 ? 1 : 0)} km`;
}

export function wikidataCandidateMeta(
  candidate: WikidataNearbyCandidate,
): string {
  const parts = [formatWikidataDistanceM(candidate.distanceM)];
  if (candidate.placeType) parts.push(candidate.placeType);
  return parts.join(" · ");
}

export function parseWikidataPinPayload(
  raw: unknown,
): WikidataPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.fetchedAt !== "string") return null;
  if (
    typeof o.wikidataId !== "string" ||
    typeof o.wikipediaTitle !== "string"
  ) {
    return null;
  }
  if (typeof o.wikipediaUrl !== "string" || typeof o.label !== "string") {
    return null;
  }
  if (typeof o.extract !== "string" || typeof o.distanceM !== "number") {
    return null;
  }
  if (o.thumbnailUrl !== null && typeof o.thumbnailUrl !== "string")
    return null;
  if (o.placeType !== null && typeof o.placeType !== "string") return null;
  return raw as WikidataPinPayload;
}

const COORD_EPSILON = 0.0001;

export function wikidataDeclinedPayload(
  lat: number,
  lng: number,
): WikidataDeclinedPayload {
  return {
    schemaVersion: 1,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    declined: true,
  };
}

export function parseWikidataDeclinedPayload(
  raw: unknown,
): WikidataDeclinedPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (o.declined !== true) return null;
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.fetchedAt !== "string") return null;
  return raw as WikidataDeclinedPayload;
}

export function wikidataDeclinedPayloadMatches(
  payload: Pick<WikidataDeclinedPayload, "lat" | "lng">,
  lat: number,
  lng: number,
): boolean {
  return (
    Math.abs(payload.lat - lat) < COORD_EPSILON &&
    Math.abs(payload.lng - lng) < COORD_EPSILON
  );
}

export function wikidataPayloadMatches(
  payload: WikidataPinPayload,
  lat: number,
  lng: number,
): boolean {
  return (
    Math.abs(payload.lat - lat) < COORD_EPSILON &&
    Math.abs(payload.lng - lng) < COORD_EPSILON
  );
}

export function wikidataSuggestionFromPayload(payload: WikidataPinPayload): {
  title: string;
  description: string;
} {
  return {
    title: payload.label,
    description: payload.extract,
  };
}
