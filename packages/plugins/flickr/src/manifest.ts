import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { FlickrIcon } from "./icon";
import { FlickrPinPhotoImportSlot } from "./pin-photo-import-slot";
import { flickrPluginMeta } from "./plugin-meta";

export const flickrPluginManifest: PluginPackageManifest = {
  id: flickrPluginMeta.typeId,
  displayName: flickrPluginMeta.displayName,
  description:
    "Attach nearby geotagged photos from Flickr without copying files (disabled — API requires Flickr Pro).",
  icon: FlickrIcon,
  implemented: flickrPluginMeta.implemented,
  PinPhotoImportSlot: FlickrPinPhotoImportSlot,
  contributions: {
    appHooks: [
      {
        name: "photos.nearbyFlickr",
        description:
          "Search Flickr for geotagged photos near a pin and attach them as external references.",
      },
    ],
    edgeFunctions: [
      {
        slug: "flickr",
        verifyJwt: true,
        description:
          "Flickr geo search and attach external photo references to pins.",
      },
    ],
  },
};
