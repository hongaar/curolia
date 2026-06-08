import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { OAUTH_COMPANION_SCOPES_BY_PROVIDER } from "@curolia/plugin-oauth";
import { GoogleMapsSavedListsAccountSettingsPanel } from "./account-settings-panel";
import { GoogleMapsSavedListsIcon } from "./icon";
import { GoogleMapsSavedListsMapSettingsPanel } from "./map-settings-panel";
import { googleMapsSavedListsPluginMeta } from "./plugin-meta";

/** API/resource scopes only; companion OIDC scopes come from `@curolia/plugin-oauth`. */
const GOOGLE_MAPS_SAVED_LISTS_RESOURCE_SCOPES = [
  "https://www.googleapis.com/auth/dataportability.maps.starred_places",
  "https://www.googleapis.com/auth/dataportability.saved.collections",
] as const;

export const googleMapsSavedListsPluginManifest: PluginPackageManifest = {
  id: googleMapsSavedListsPluginMeta.typeId,
  displayName: googleMapsSavedListsPluginMeta.displayName,
  description: "Import starred places and saved lists from Google Maps.",
  icon: GoogleMapsSavedListsIcon,
  implemented: googleMapsSavedListsPluginMeta.implemented,
  AccountSettingsPanel: GoogleMapsSavedListsAccountSettingsPanel,
  MapSettingsPanel: GoogleMapsSavedListsMapSettingsPanel,
  contributions: {
    oauth: [
      {
        provider: "google",
        scopes: [
          ...OAUTH_COMPANION_SCOPES_BY_PROVIDER.google,
          ...GOOGLE_MAPS_SAVED_LISTS_RESOURCE_SCOPES,
        ],
      },
    ],
    mapSettings: {
      panel: "modal",
      title: "Google Maps",
    },
    edgeFunctions: [
      {
        slug: "google-maps-saved-lists",
        verifyJwt: false,
        description:
          "Import Google Maps starred places and saved lists via Data Portability API.",
      },
    ],
  },
};
