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
  schemaVersion: 2;
  lat: number;
  lng: number;
  fetchedAt: string;
  wikidataId: string;
  wikipediaLang: string;
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
  wikipediaLang: string;
  distanceM: number;
  placeType: string | null;
  thumbnailUrl: string | null;
};

/** Wikipedia search row for the pin editor combobox. */
export type WikidataSearchHit = {
  wikidataId: string;
  label: string;
  wikipediaTitle: string;
  wikipediaLang: string;
  thumbnailUrl: string | null;
  snippet: string | null;
};

export type WikidataSearchGroup = {
  lang: string;
  label: string;
  results: WikidataSearchHit[];
};

export function wikidataSearchHitKey(hit: WikidataSearchHit): string {
  return `${hit.wikipediaLang}:${hit.wikidataId}`;
}

export function formatWikidataDistanceM(distanceM: number): string {
  if (distanceM < 1000) return `${distanceM} m`;
  return `${(distanceM / 1000).toFixed(distanceM < 10_000 ? 1 : 0)} km`;
}

export function looksLikeWikidataId(value: string): boolean {
  return /^Q\d+$/i.test(value.trim());
}

export function wikidataDisplayLabel(
  payload: Pick<WikidataPinPayload, "label" | "wikipediaTitle">,
): string {
  if (looksLikeWikidataId(payload.label)) return payload.wikipediaTitle;
  return payload.label;
}

export function wikidataCandidateMeta(
  candidate: WikidataNearbyCandidate,
): string {
  const parts: string[] = [];
  if (candidate.distanceM > 0) {
    parts.push(formatWikidataDistanceM(candidate.distanceM));
  }
  if (candidate.placeType) parts.push(candidate.placeType);
  return parts.join(" · ");
}

export function wikidataCandidateTitle(
  candidate: WikidataNearbyCandidate,
): string {
  if (looksLikeWikidataId(candidate.label)) return candidate.wikipediaTitle;
  return candidate.label;
}

export function parseWikidataPinPayload(
  raw: unknown,
): WikidataPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const version = o.schemaVersion;
  if (version !== 1 && version !== 2) return null;
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

  const wikipediaLang =
    version === 2 && typeof o.wikipediaLang === "string"
      ? o.wikipediaLang
      : "en";

  return {
    schemaVersion: 2,
    lat: o.lat,
    lng: o.lng,
    fetchedAt: o.fetchedAt,
    wikidataId: o.wikidataId,
    wikipediaLang,
    wikipediaTitle: o.wikipediaTitle,
    wikipediaUrl: o.wikipediaUrl,
    label: o.label,
    extract: o.extract,
    thumbnailUrl: o.thumbnailUrl as string | null,
    distanceM: o.distanceM,
    placeType: o.placeType as string | null,
  };
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
