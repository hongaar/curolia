import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { OpenMeteoIcon } from "./icon";
import { OpenMeteoMapSettingsPanel } from "./map-settings-panel";
import { openMeteoPluginMeta } from "./plugin-meta";

export const openMeteoPluginManifest: PluginPackageManifest = {
  id: openMeteoPluginMeta.typeId,
  displayName: openMeteoPluginMeta.displayName,
  description:
    "Show current and historical weather from Open-Meteo on pins (current conditions when undated, historical averages when dates are set).",
  icon: OpenMeteoIcon,
  implemented: openMeteoPluginMeta.implemented,
  pinOutputScope: "map",
  MapSettingsPanel: OpenMeteoMapSettingsPanel,
  contributions: {
    mapSettings: {
      panel: "inline",
      title: "Weather",
    },
  },
};
