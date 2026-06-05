import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { OsmPoiIcon } from "./icon";
import { OsmPoiMapSettingsPanel } from "./map-settings-panel";
import { OsmPoiPinFormSection } from "./pin-form-section";
import { osmPoiPluginMeta } from "./plugin-meta";
import { osmPoiSyncRegistry } from "./sync-registry";

export const osmPoiPluginManifest: PluginPackageManifest = {
  id: osmPoiPluginMeta.typeId,
  displayName: osmPoiPluginMeta.displayName,
  description:
    "Reverse-enrich pins with OpenStreetMap tags—amenity type, cuisine, wheelchair access, and more.",
  icon: OsmPoiIcon,
  implemented: osmPoiPluginMeta.implemented,
  MapSettingsPanel: OsmPoiMapSettingsPanel,
  PinFormSection: OsmPoiPinFormSection,
  contributions: {
    mapSettings: {
      panel: "inline",
      title: "OpenStreetMap",
    },
    edgeFunctions: [
      {
        slug: "osm-poi",
        verifyJwt: true,
        description:
          "Query the Overpass API for the nearest OSM feature at pin coordinates.",
      },
      {
        slug: osmPoiSyncRegistry.dispatchFunctionSlug,
        verifyJwt: false,
        description: "Process pending OSM POI sync jobs from plugin_sync_jobs.",
      },
    ],
    syncJobs: {
      events: [...osmPoiSyncRegistry.events],
      dispatchFunctionSlug: osmPoiSyncRegistry.dispatchFunctionSlug,
      dispatchSecretEnvVar: osmPoiSyncRegistry.dispatchSecretEnvVar,
    },
  },
};
