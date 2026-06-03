import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { SpotifyAccountSettingsPanel } from "./account-settings-panel";
import { SpotifyIcon } from "./icon";
import { SpotifyPinDetailSection } from "./pin-detail-section";
import { SpotifyPinFormSection } from "./pin-form-section";
import { spotifyPluginMeta } from "./plugin-meta";

const SPOTIFY_RESOURCE_SCOPES = [
  "user-read-email",
  "playlist-read-private",
  "user-library-read",
] as const;

export const spotifyPluginManifest: PluginPackageManifest = {
  id: spotifyPluginMeta.typeId,
  displayName: spotifyPluginMeta.displayName,
  description:
    "Attach Spotify tracks and playlists to pins so each place has a soundtrack.",
  icon: SpotifyIcon,
  implemented: spotifyPluginMeta.implemented,
  AccountSettingsPanel: SpotifyAccountSettingsPanel,
  PinFormSection: SpotifyPinFormSection,
  PinDetailSection: SpotifyPinDetailSection,
  pinDetailPlain: true,
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
          "Resolve Spotify track and playlist URLs to metadata for pin attachments.",
      },
    ],
  },
};
