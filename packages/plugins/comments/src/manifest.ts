import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { CommentsIcon } from "./icon";
import { CommentsMapSettingsPanel } from "./map-settings-panel";
import { CommentsPinInteractionSection } from "./pin-interaction-section";
import { commentsPluginMeta } from "./plugin-meta";

export const commentsPluginManifest: PluginPackageManifest = {
  id: commentsPluginMeta.typeId,
  displayName: commentsPluginMeta.displayName,
  description:
    "Let map visitors leave comments on pins. Optionally allow signed-out visitors to comment on public maps.",
  icon: CommentsIcon,
  implemented: commentsPluginMeta.implemented,
  pinOutputScope: "map",
  pinInteractionOrder: 20,
  PinInteractionSection: CommentsPinInteractionSection,
  MapSettingsPanel: CommentsMapSettingsPanel,
  contributions: {
    mapSettings: {
      title: "Comments",
      panel: "inline",
    },
  },
};
