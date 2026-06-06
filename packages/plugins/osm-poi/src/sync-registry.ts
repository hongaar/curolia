import {
  PLUGIN_SYNC_DISPATCH_SECRET_ENV,
  PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED,
} from "@curolia/plugin-contract";
import { OSM_POI_PLUGIN_ID } from "./config";

/** Backend sync registration for the OSM POI plugin (dispatch registry only). */
export const osmPoiSyncRegistry = {
  pluginTypeId: OSM_POI_PLUGIN_ID,
  events: [PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED] as const,
  dispatchFunctionSlug: "osm-poi-dispatch",
  dispatchSecretEnvVar: PLUGIN_SYNC_DISPATCH_SECRET_ENV,
} as const;

export const OSM_POI_SYNC_EVENT = PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED;
