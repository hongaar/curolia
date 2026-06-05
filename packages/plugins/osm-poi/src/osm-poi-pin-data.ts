import { OSM_POI_CACHE_MAX_AGE_MS, OSM_POI_COORD_EPSILON } from "./constants";
import { primaryPoiLabel } from "./osm-poi-format";

/** Nearby OSM place row for the pin editor picker. */
export type OsmPoiNearbyCandidate = {
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string | null;
  placeType: string | null;
  distanceM: number;
};

/** Shape stored in `plugin_entity_data.data` for `plugin_type_id = osm-poi`. */
export type OsmPoiPinPayload = {
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

export function parseOsmPoiPinPayload(raw: unknown): OsmPoiPinPayload | null {
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

export function formatOsmPoiDistanceM(distanceM: number): string {
  if (distanceM < 1000) return `${distanceM} m`;
  return `${(distanceM / 1000).toFixed(distanceM < 10_000 ? 1 : 0)} km`;
}

export function osmPoiLabelFromTags(tags: Record<string, string>): string {
  const name = tags.name?.trim();
  if (name) return name;
  return primaryPoiLabel(tags) ?? "Unnamed place";
}

export function osmPoiCandidateTitle(candidate: OsmPoiNearbyCandidate): string {
  if (candidate.name) return candidate.name;
  return candidate.placeType ?? "Unnamed place";
}

export function osmPoiCandidateMeta(candidate: OsmPoiNearbyCandidate): string {
  const parts: string[] = [];
  if (candidate.name && candidate.placeType) {
    parts.push(candidate.placeType);
  }
  parts.push(formatOsmPoiDistanceM(candidate.distanceM));
  return parts.join(" · ");
}

export type OsmPoiLinkedPoiView = {
  label: string;
  distanceM: number;
  osmType: "node" | "way" | "relation";
  osmId: number;
};

export function osmPoiPayloadFromCandidate(
  lat: number,
  lng: number,
  candidate: OsmPoiNearbyCandidate,
): OsmPoiPinPayload {
  const tags: Record<string, string> = {};
  if (candidate.name) tags.name = candidate.name;
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

export function resolveOsmPoiLinkedView(
  payload: OsmPoiPinPayload | null,
  pendingCandidate: OsmPoiNearbyCandidate | null,
): OsmPoiLinkedPoiView | null {
  if (
    payload &&
    !payload.noPoi &&
    payload.tags &&
    payload.osmType &&
    payload.osmId
  ) {
    return {
      label: osmPoiLabelFromTags(payload.tags),
      distanceM: payload.distanceM ?? 0,
      osmType: payload.osmType,
      osmId: payload.osmId,
    };
  }
  if (pendingCandidate) {
    return {
      label: osmPoiCandidateTitle(pendingCandidate),
      distanceM: pendingCandidate.distanceM,
      osmType: pendingCandidate.osmType,
      osmId: pendingCandidate.osmId,
    };
  }
  return null;
}

/** Single-line label for compact picker rows: name · type · distance. */
export function osmPoiCandidateLine(candidate: OsmPoiNearbyCandidate): string {
  const parts: string[] = [];
  if (candidate.name) {
    parts.push(candidate.name);
    if (candidate.placeType) parts.push(candidate.placeType);
  } else if (candidate.placeType) {
    parts.push(candidate.placeType);
  } else {
    parts.push("Unnamed place");
  }
  parts.push(formatOsmPoiDistanceM(candidate.distanceM));
  return parts.join(" · ");
}

export function osmPoiElementUrl(
  osmType: "node" | "way" | "relation",
  osmId: number,
): string {
  return `https://www.openstreetmap.org/${osmType}/${osmId}`;
}

export function osmPoiPayloadMatches(
  payload: OsmPoiPinPayload,
  lat: number,
  lng: number,
): boolean {
  if (
    Math.abs(payload.lat - lat) >= OSM_POI_COORD_EPSILON ||
    Math.abs(payload.lng - lng) >= OSM_POI_COORD_EPSILON
  ) {
    return false;
  }
  const age = Date.now() - new Date(payload.fetchedAt).getTime();
  return age >= 0 && age <= OSM_POI_CACHE_MAX_AGE_MS;
}
