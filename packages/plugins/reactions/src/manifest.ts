import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { ReactionsIcon } from "./icon";
import { ReactionsMapSettingsPanel } from "./map-settings-panel";
import { ReactionsPinInteractionSection } from "./pin-interaction-section";
import { ReactionsPinMetaSummary } from "./pin-meta-summary";
import { reactionsPluginMeta } from "./plugin-meta";

export const reactionsPluginManifest: PluginPackageManifest = {
  id: reactionsPluginMeta.typeId,
  displayName: reactionsPluginMeta.displayName,
  description:
    "Let map visitors react to pins with emoji. Optionally allow signed-out visitors to react on public maps.",
  icon: ReactionsIcon,
  implemented: reactionsPluginMeta.implemented,
  pinOutputScope: "map",
  pinInteractionOrder: 10,
  pinInteractionPlain: true,
  PinInteractionSection: ReactionsPinInteractionSection,
  PinMetaSummary: ReactionsPinMetaSummary,
  MapSettingsPanel: ReactionsMapSettingsPanel,
  contributions: {
    mapSettings: {
      title: "Reactions",
      panel: "inline",
    },
  },
};
