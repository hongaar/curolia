import {
  PLUGIN_SYNC_DISPATCH_SECRET_ENV,
  PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED,
} from "@curolia/plugin-contract";
import { POI_PLUGIN_ID } from "./config";

/** Backend sync registration for the POI plugin (dispatch registry only). */
export const poiSyncRegistry = {
  pluginTypeId: POI_PLUGIN_ID,
  events: [PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED] as const,
  dispatchFunctionSlug: "poi-dispatch",
  dispatchSecretEnvVar: PLUGIN_SYNC_DISPATCH_SECRET_ENV,
} as const;

export const POI_SYNC_EVENT = PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED;
