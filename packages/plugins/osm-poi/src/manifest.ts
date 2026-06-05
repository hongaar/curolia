import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { OsmPoiIcon } from "./icon";
import { OsmPoiMapSettingsPanel } from "./map-settings-panel";
import { osmPoiPluginMeta } from "./plugin-meta";

export const osmPoiPluginManifest: PluginPackageManifest = {
  id: osmPoiPluginMeta.typeId,
  displayName: osmPoiPluginMeta.displayName,
  description:
    "Reverse-enrich pins with OpenStreetMap tags—amenity type, cuisine, wheelchair access, and more.",
  icon: OsmPoiIcon,
  implemented: osmPoiPluginMeta.implemented,
  MapSettingsPanel: OsmPoiMapSettingsPanel,
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
    ],
  },
};
