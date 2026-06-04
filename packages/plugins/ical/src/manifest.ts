import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { IcalIcon } from "./icon";
import { IcalMapSettingsPanel } from "./map-settings-panel";

export const icalPluginManifest: PluginPackageManifest = {
  id: "ical",
  displayName: "iCalendar",
  description: "Publish pins as iCalendar (.ics) files.",
  icon: IcalIcon,
  implemented: true,
  MapSettingsPanel: IcalMapSettingsPanel,
  contributions: {
    mapSettings: {
      panel: "inline",
      title: "iCalendar feed",
    },
    edgeFunctions: [
      {
        slug: "ical-feed",
        verifyJwt: false,
        description: "Public .ics subscription URL (token query param).",
      },
    ],
  },
};
