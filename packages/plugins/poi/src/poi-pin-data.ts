import { POI_CACHE_MAX_AGE_MS, POI_COORD_EPSILON } from "./constants";
import { primaryPoiLabel } from "./poi-format";

/** Nearby place row for the pin editor picker. */
export type PoiNearbyCandidate = {
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string | null;
  placeType: string | null;
  distanceM: number;
  tags?: Record<string, string>;
};

/** Shape stored in `plugin_entity_data.data` for `plugin_type_id = poi`. */
export type PoiPinPayload = {
  schemaVersion: 1;
  lat: number;
  lng: number;
  fetchedAt: string;
  noPoi?: boolean;
  osmType?: "node" | "way" | "relation";
  osmId?: number;
  distanceM?: number;
  tags?: Record<string, string>;
};

export function parsePoiPinPayload(raw: unknown): PoiPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.fetchedAt !== "string") return null;

  if (o.noPoi === true) {
    return {
      schemaVersion: 1,
      lat: o.lat,
      lng: o.lng,
      fetchedAt: o.fetchedAt,
      noPoi: true,
    };
  }

  if (typeof o.osmId !== "number" || typeof o.osmType !== "string") return null;
  if (o.osmType !== "node" && o.osmType !== "way" && o.osmType !== "relation") {
    return null;
  }
  if (!o.tags || typeof o.tags !== "object" || Array.isArray(o.tags)) {
    return null;
  }

  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(o.tags)) {
    if (typeof value === "string") tags[key] = value;
  }

  return {
    schemaVersion: 1,
    lat: o.lat,
    lng: o.lng,
    fetchedAt: o.fetchedAt,
    osmType: o.osmType,
    osmId: o.osmId,
    distanceM: typeof o.distanceM === "number" ? o.distanceM : undefined,
    tags,
  };
}

export function formatPoiDistanceM(distanceM: number): string {
  if (distanceM < 1000) return `${distanceM} m`;
  return `${(distanceM / 1000).toFixed(distanceM < 10_000 ? 1 : 0)} km`;
}

export function poiLabelFromTags(tags: Record<string, string>): string {
  const name = tags.name?.trim();
  if (name) return name;
  return primaryPoiLabel(tags) ?? "Unnamed place";
}

export function poiCandidateTitle(candidate: PoiNearbyCandidate): string {
  if (candidate.name) return candidate.name;
  return candidate.placeType ?? "Unnamed place";
}

export function poiCandidateMeta(candidate: PoiNearbyCandidate): string {
  const parts: string[] = [];
  if (candidate.name && candidate.placeType) {
    parts.push(candidate.placeType);
  }
  parts.push(formatPoiDistanceM(candidate.distanceM));
  return parts.join(" · ");
}

export type PoiLinkedPoiView = {
  label: string;
  distanceM: number;
  osmType: "node" | "way" | "relation";
  osmId: number;
};

export function poiPayloadFromCandidate(
  lat: number,
  lng: number,
  candidate: PoiNearbyCandidate,
): PoiPinPayload {
  const tags: Record<string, string> = candidate.tags
    ? { ...candidate.tags }
    : {};
  if (candidate.name && !tags.name) tags.name = candidate.name;
  return {
    schemaVersion: 1,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    osmType: candidate.osmType,
    osmId: candidate.osmId,
    distanceM: candidate.distanceM,
    tags,
  };
}

export function resolvePoiLinkedView(
  payload: PoiPinPayload | null,
  pendingCandidate: PoiNearbyCandidate | null,
): PoiLinkedPoiView | null {
  if (
    payload &&
    !payload.noPoi &&
    payload.tags &&
    payload.osmType &&
    payload.osmId
  ) {
    return {
      label: poiLabelFromTags(payload.tags),
      distanceM: payload.distanceM ?? 0,
      osmType: payload.osmType,
      osmId: payload.osmId,
    };
  }
  if (pendingCandidate) {
    return {
      label: poiCandidateTitle(pendingCandidate),
      distanceM: pendingCandidate.distanceM,
      osmType: pendingCandidate.osmType,
      osmId: pendingCandidate.osmId,
    };
  }
  return null;
}

/** Single-line label for compact picker rows: name · type · distance. */
export function poiCandidateLine(candidate: PoiNearbyCandidate): string {
  const parts: string[] = [];
  if (candidate.name) {
    parts.push(candidate.name);
    if (candidate.placeType) parts.push(candidate.placeType);
  } else if (candidate.placeType) {
    parts.push(candidate.placeType);
  } else {
    parts.push("Unnamed place");
  }
  parts.push(formatPoiDistanceM(candidate.distanceM));
  return parts.join(" · ");
}

export function poiElementUrl(
  osmType: "node" | "way" | "relation",
  osmId: number,
): string {
  return `https://www.openstreetmap.org/${osmType}/${osmId}`;
}

export function poiPayloadMatches(
  payload: PoiPinPayload,
  lat: number,
  lng: number,
): boolean {
  if (
    Math.abs(payload.lat - lat) >= POI_COORD_EPSILON ||
    Math.abs(payload.lng - lng) >= POI_COORD_EPSILON
  ) {
    return false;
  }
  const age = Date.now() - new Date(payload.fetchedAt).getTime();
  return age >= 0 && age <= POI_CACHE_MAX_AGE_MS;
}
