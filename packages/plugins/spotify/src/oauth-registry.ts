/**
 * OAuth metadata for Edge registry extraction (no React / CSS imports).
 * Keep in sync with contributions.oauth in manifest.ts.
 */
import { spotifyPluginMeta } from "./plugin-meta";

const SPOTIFY_RESOURCE_SCOPES = ["user-read-recently-played"] as const;

export const pluginOAuthRegistry = {
  id: spotifyPluginMeta.typeId,
  oauth: [
    {
      provider: "spotify",
      scopes: [...SPOTIFY_RESOURCE_SCOPES],
    },
  ],
} as const;
