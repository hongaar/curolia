import { spotifyPluginMeta } from "./plugin-meta";

/**
 * React Query key for Spotify Edge sync. Includes pin dates so a new fetch runs when
 * the shell passes updated dates after save (no extra invalidation logic in the web app).
 */
export function spotifyPinSyncQueryKey(
  pinId: string,
  pinDate: string | null | undefined,
  pinEndDate: string | null | undefined,
) {
  return [
    "spotify_pin_sync",
    spotifyPluginMeta.typeId,
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
