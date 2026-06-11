import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { DirectionsAccountSettingsPanel } from "./account-settings-panel";
import { DirectionsIcon } from "./icon";
import { DirectionsPinDetailAction } from "./pin-detail-action";
import { directionsPluginMeta } from "./plugin-meta";

export const directionsPluginManifest: PluginPackageManifest = {
  id: directionsPluginMeta.typeId,
  displayName: directionsPluginMeta.displayName,
  description:
    "Open turn-by-turn directions to any pin in Google Maps, Apple Maps, Waze, and other navigation apps.",
  icon: DirectionsIcon,
  implemented: directionsPluginMeta.implemented,
  AccountSettingsPanel: DirectionsAccountSettingsPanel,
  PinDetailAction: DirectionsPinDetailAction,
  contributions: {
    globalSettings: {
      title: "Directions",
      fields: [
        {
          kind: "section",
          label: "Navigation app",
          description:
            "Choose which map provider opens when you tap Directions on a pin.",
          children: [
            {
              kind: "text",
              key: "directions.provider",
              label: "Map provider",
            },
          ],
        },
      ],
    },
  },
};
