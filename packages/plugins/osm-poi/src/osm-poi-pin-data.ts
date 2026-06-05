import { OSM_POI_CACHE_MAX_AGE_MS, OSM_POI_COORD_EPSILON } from "./constants";

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
