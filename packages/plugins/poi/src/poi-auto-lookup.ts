import {
  isPluginSyncJobActive,
  PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED,
  pluginSyncEventsFromConfig,
  type PluginSyncJobStatus,
} from "@curolia/plugin-contract";
import { POI_PLUGIN_ID } from "./config";
import type { PoiPinPayload } from "./poi-pin-data";

export function isMapPoiAutoLookupEnabled(
  mapPlugin:
    | {
        enabled?: boolean | null;
        config?: Record<string, unknown> | null;
      }
    | null
    | undefined,
): boolean {
  if (!mapPlugin?.enabled) return false;
  const events = pluginSyncEventsFromConfig(mapPlugin.config ?? undefined);
  return events.includes(PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED);
}

export const poiMapPluginQueryKey = (mapId: string) =>
  ["map_plugins", mapId, POI_PLUGIN_ID] as const;

export type PoiMetadataLoadingInput = {
  /** POI plugin enabled for the user account. */
  pluginEnabled: boolean;
  /** Auto-lookup enabled on this map. */
  autoLookupEnabled: boolean;
  canSync: boolean;
  syncJobStatus: PluginSyncJobStatus | null | undefined;
  entityDataPending: boolean;
  cachedPayload: PoiPinPayload | null;
  autoLookupInFlight: boolean;
  autoLookupFailed: boolean;
  metadataFetching: boolean;
  metadataIsFresh: boolean;
  metadataQueryError: boolean;
};

/** Whether pin detail should show the POI metadata loading placeholder. */
export function resolvePoiMetadataLoading(
  input: PoiMetadataLoadingInput,
): boolean {
  if (!input.pluginEnabled || !input.autoLookupEnabled || !input.canSync) {
    return false;
  }

  if (input.syncJobStatus === "failed" || input.autoLookupFailed) return false;

  if (input.cachedPayload?.noPoi) return false;

  if (input.autoLookupInFlight) return true;

  if (
    input.cachedPayload &&
    !input.cachedPayload.noPoi &&
    input.metadataIsFresh &&
    !input.metadataFetching
  ) {
    return false;
  }

  if (isPluginSyncJobActive(input.syncJobStatus)) return true;

  if (input.entityDataPending && input.cachedPayload == null) return true;

  if (
    input.cachedPayload &&
    !input.cachedPayload.noPoi &&
    !input.metadataQueryError &&
    (input.metadataFetching || !input.metadataIsFresh)
  ) {
    return true;
  }

  return input.cachedPayload == null;
}

export function shouldTriggerPoiAutoLookup(input: {
  autoLookupEnabled: boolean;
  canSync: boolean;
  cachedPayload: PoiPinPayload | null;
  syncJobStatus: PluginSyncJobStatus | null | undefined;
  autoLookupInFlight: boolean;
  autoLookupFailed: boolean;
}): boolean {
  if (!input.autoLookupEnabled || !input.canSync) return false;
  if (input.cachedPayload) return false;
  if (input.syncJobStatus === "failed" || input.autoLookupFailed) return false;
  if (input.autoLookupInFlight) return false;
  return true;
}
