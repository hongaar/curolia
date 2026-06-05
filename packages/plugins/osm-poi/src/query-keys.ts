import { OSM_POI_PLUGIN_ID } from "./config";

export function osmPoiEntityDataQueryKey(pinId: string): readonly string[] {
  return ["plugin_entity_data", "pin", pinId, OSM_POI_PLUGIN_ID] as const;
}

export function osmPoiSyncQueryKey(
  pinId: string,
  lat: number,
  lng: number,
): readonly (string | number)[] {
  return ["osm-poi", "sync", pinId, lat, lng] as const;
}
