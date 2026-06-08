import { googleMapsSavedListsPluginMeta } from "./plugin-meta";

const GOOGLE_MAPS_SAVED_LISTS_RESOURCE_SCOPES = [
  "https://www.googleapis.com/auth/dataportability.maps.starred_places",
  "https://www.googleapis.com/auth/dataportability.saved.collections",
] as const;

export const pluginOAuthRegistry = {
  id: googleMapsSavedListsPluginMeta.typeId,
  oauth: [
    {
      provider: "google",
      scopes: [...GOOGLE_MAPS_SAVED_LISTS_RESOURCE_SCOPES],
    },
  ],
} as const;
