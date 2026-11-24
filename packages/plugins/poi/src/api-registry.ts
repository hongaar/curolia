import type { PluginApiRegistryEntry } from "@curolia/plugin-contract";
import { POI_PLUGIN_ID } from "./config";

/** Public REST API exposure for the POI plugin (pure data; extracted by `functions:sync`). */
export const poiApiRegistry = {
  pluginTypeId: POI_PLUGIN_ID,
  pin: {
    read: true,
    write: true,
    description:
      "Nearby place metadata (OSM type/id, distance and tags) attached to the pin.",
  },
} as const satisfies PluginApiRegistryEntry;
