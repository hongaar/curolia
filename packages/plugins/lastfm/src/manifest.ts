import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { LastfmAccountSettingsPanel } from "./account-settings-panel";
import { LastfmIcon } from "./icon";
import { lastfmPluginMeta } from "./plugin-meta";
import { LastfmPinDetailSection } from "./pin-detail-section";

export const lastfmPluginManifest: PluginPackageManifest = {
  id: lastfmPluginMeta.typeId,
  displayName: lastfmPluginMeta.displayName,
  description:
    "Show your most-scrobbled Last.fm tracks during each pin’s date range on the pin page.",
  icon: LastfmIcon,
  implemented: lastfmPluginMeta.implemented,
  AccountSettingsPanel: LastfmAccountSettingsPanel,
  PinDetailSection: LastfmPinDetailSection,
  contributions: {
    edgeFunctions: [
      {
        slug: "lastfm",
        verifyJwt: true,
        description:
          "Fetch Last.fm recent tracks for a pin window and upsert plugin_entity_data.",
      },
    ],
  },
};
