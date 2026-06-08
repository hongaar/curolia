import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { PoiIcon } from "./icon";
import { PoiPinFormSection } from "./pin-form-section";
import { poiPluginMeta } from "./plugin-meta";

export const poiPluginManifest: PluginPackageManifest = {
  id: poiPluginMeta.typeId,
  displayName: poiPluginMeta.displayName,
  description:
    "Enrich pins with nearby place metadata—amenity type, cuisine, wheelchair access, and more.",
  icon: PoiIcon,
  implemented: poiPluginMeta.implemented,
  PinFormSection: PoiPinFormSection,
  contributions: {
    edgeFunctions: [
      {
        slug: "poi",
        verifyJwt: true,
        description:
          "Query nearby places and enrich pins with metadata (Geoapify / OSM).",
      },
    ],
  },
};
