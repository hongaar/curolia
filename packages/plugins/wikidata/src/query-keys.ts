import { wikidataPluginMeta } from "./plugin-meta";

export function wikidataPinSyncQueryKey(
  pinId: string,
  lat: number | null | undefined,
  lng: number | null | undefined,
) {
  return [
    "wikidata_pin_sync",
    wikidataPluginMeta.typeId,
    pinId,
    lat ?? "",
    lng ?? "",
  ] as const;
}

export function wikidataNearbyLookupQueryKey(lat: number, lng: number) {
  return [
    "wikidata_nearby_lookup",
    wikidataPluginMeta.typeId,
    lat,
    lng,
  ] as const;
}

export function wikidataNearbyCandidatesQueryKey(
  pinId: string,
  lat: number,
  lng: number,
) {
  return [
    "wikidata_nearby_candidates",
    wikidataPluginMeta.typeId,
    pinId,
    lat,
    lng,
  ] as const;
}

export function wikidataSearchQueryKey(query: string) {
  return ["wikidata_search", wikidataPluginMeta.typeId, query] as const;
}

export function pluginEntityDataRowQueryKey(
  pluginTypeId: string,
  entityType: string,
  entityId: string,
) {
  return ["plugin_entity_data", pluginTypeId, entityType, entityId] as const;
}
