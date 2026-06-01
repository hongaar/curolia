import { lastfmPluginMeta } from "./plugin-meta";

/**
 * React Query key for Last.fm Edge sync. Includes pin dates so a new fetch runs when
 * the shell passes updated dates after save.
 */
export function lastfmPinSyncQueryKey(
  pinId: string,
  pinDate: string | null | undefined,
  pinEndDate: string | null | undefined,
) {
  return [
    "lastfm_pin_sync",
    lastfmPluginMeta.typeId,
    pinId,
    pinDate ?? "",
    pinEndDate ?? "",
  ] as const;
}

/** Cache key for reading `plugin_entity_data` rows client-side. */
export function pluginEntityDataRowQueryKey(
  pluginTypeId: string,
  entityType: string,
  entityId: string,
) {
  return ["plugin_entity_data", pluginTypeId, entityType, entityId] as const;
}
