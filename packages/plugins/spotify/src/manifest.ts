import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { SpotifyAccountSettingsPanel } from "./account-settings-panel";
import { SpotifyIcon } from "./icon";
import { spotifyPluginMeta } from "./plugin-meta";
import { SpotifyPinDetailSection } from "./pin-detail-section";

/** Spotify Web API scopes (PKCE); companion scopes for `spotify` live in `@curolia/plugin-oauth`. */
const SPOTIFY_RESOURCE_SCOPES = ["user-read-recently-played"] as const;

export const spotifyPluginManifest: PluginPackageManifest = {
  id: spotifyPluginMeta.typeId,
  displayName: spotifyPluginMeta.displayName,
  description:
    "Show your most-played Spotify tracks during each pin’s date range on the pin page.",
  icon: SpotifyIcon,
  implemented: spotifyPluginMeta.implemented,
  AccountSettingsPanel: SpotifyAccountSettingsPanel,
  PinDetailSection: SpotifyPinDetailSection,
  contributions: {
    oauth: [
      {
        provider: "spotify",
        scopes: [...SPOTIFY_RESOURCE_SCOPES],
      },
    ],
    edgeFunctions: [
      {
        slug: "spotify",
        verifyJwt: true,
        description:
          "Fetch Spotify listening history for a pin window and upsert plugin_entity_data.",
      },
    ],
  },
};
