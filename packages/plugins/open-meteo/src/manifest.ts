import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { OpenMeteoIcon } from "./icon";
import { OpenMeteoMapSettingsPanel } from "./map-settings-panel";
import { openMeteoPluginMeta } from "./plugin-meta";

export const openMeteoPluginManifest: PluginPackageManifest = {
  id: openMeteoPluginMeta.typeId,
  displayName: openMeteoPluginMeta.displayName,
  description:
    "Show historical weather from Open-Meteo on pins that have a date (averaged over multi-day stays).",
  icon: OpenMeteoIcon,
  implemented: openMeteoPluginMeta.implemented,
  MapSettingsPanel: OpenMeteoMapSettingsPanel,
  contributions: {
    mapSettings: {
      panel: "inline",
      title: "Historical weather",
    },
  },
};
