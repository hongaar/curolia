import { POI_PLUGIN_ID } from "./config";

export function poiEntityDataQueryKey(pinId: string): readonly string[] {
  return ["plugin_entity_data", "pin", pinId, POI_PLUGIN_ID] as const;
}

export function poiSyncQueryKey(
  pinId: string,
  lat: number,
  lng: number,
): readonly (string | number)[] {
  return ["poi", "sync", pinId, lat, lng] as const;
}

export function pinMetadataQueryKey(pinId: string): readonly string[] {
  return ["pin_metadata", pinId] as const;
}

export function poiNearbyCandidatesQueryKey(
  pinId: string,
  lat: number,
  lng: number,
): readonly (string | number)[] {
  return ["poi", "nearby_candidates", pinId, lat, lng] as const;
}

export function poiSearchQueryKey(
  pinId: string,
  query: string,
): readonly string[] {
  return ["poi", "search", pinId, query] as const;
}

export function poiSyncJobQueryKey(pinId: string): readonly string[] {
  return ["poi", "sync_job", pinId] as const;
}
