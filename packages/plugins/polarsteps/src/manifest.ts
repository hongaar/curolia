import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { PolarstepsIcon } from "./icon";
import { PolarstepsMapSettingsPanel } from "./map-settings-panel";
import { polarstepsPluginMeta } from "./plugin-meta";

export const polarstepsPluginManifest: PluginPackageManifest = {
  id: polarstepsPluginMeta.typeId,
  displayName: polarstepsPluginMeta.displayName,
  description:
    "Import Polarsteps trips from a share link as map pins and photos.",
  icon: PolarstepsIcon,
  implemented: polarstepsPluginMeta.implemented,
  MapSettingsPanel: PolarstepsMapSettingsPanel,
  contributions: {
    mapSettings: {
      panel: "modal",
      title: "Polarsteps",
    },
    edgeFunctions: [
      {
        slug: "polarsteps",
        verifyJwt: false,
        description:
          "Import Polarsteps trip steps and photos via trip share URLs.",
      },
    ],
  },
};
