import type { MapPlugin } from "@/types/database";
import { IcalPluginMapSettings } from "./ical-plugin-map-settings";

type Props = {
  pluginTypeId: string;
  mapId: string;
  /** Per-map row; created on first save when missing. */
  jp: MapPlugin | undefined;
  /** Whether this plugin is enabled for your account (Plugins in the user menu). */
  pluginGloballyEnabled: boolean;
  readOnly?: boolean;
};

/**
 * Renders per-map plugin options. Add a branch per implemented plugin.
 */
export function PluginMapSettings({
  pluginTypeId,
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: Props) {
  switch (pluginTypeId) {
    case "ical":
      return (
        <IcalPluginMapSettings
          mapId={mapId}
          jp={jp}
          pluginGloballyEnabled={pluginGloballyEnabled}
          readOnly={readOnly}
        />
      );
    default:
      return null;
  }
}
