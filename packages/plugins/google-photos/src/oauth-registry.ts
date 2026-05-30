/**
 * OAuth metadata for Edge registry extraction (no React / CSS imports).
 * Keep in sync with contributions.oauth in manifest.ts (resource scopes only).
 */
import { googlePhotosPluginMeta } from "./plugin-meta";

const GOOGLE_PHOTOS_RESOURCE_SCOPES = [
  "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
] as const;

export const pluginOAuthRegistry = {
  id: googlePhotosPluginMeta.typeId,
  oauth: [
    {
      provider: "google",
      scopes: [...GOOGLE_PHOTOS_RESOURCE_SCOPES],
    },
  ],
} as const;
