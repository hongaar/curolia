import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { CommonsIcon } from "./icon";
import { CommonsPinPhotoImportSlot } from "./pin-photo-import-slot";
import { commonsPluginMeta } from "./plugin-meta";

export const commonsPluginManifest: PluginPackageManifest = {
  id: commonsPluginMeta.typeId,
  displayName: commonsPluginMeta.displayName,
  description: "Attach nearby openly licensed photos from Wikimedia Commons.",
  icon: CommonsIcon,
  implemented: commonsPluginMeta.implemented,
  PinPhotoImportSlot: CommonsPinPhotoImportSlot,
  contributions: {
    appHooks: [
      {
        name: "photos.nearbyCommons",
        description:
          "Search Wikimedia Commons for geotagged photos near a pin and attach them as external references.",
      },
    ],
    edgeFunctions: [
      {
        slug: "commons",
        verifyJwt: true,
        description:
          "Wikimedia Commons geo search and attach external photo references to pins.",
      },
    ],
  },
};
