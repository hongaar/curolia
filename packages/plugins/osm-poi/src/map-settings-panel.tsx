import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import { mapPluginConfigRecord } from "@curolia/plugin-contract";
import { Label } from "@curolia/ui/label";
import {
  PluginSettingsBox,
  PluginSettingsHint,
  PluginSettingsRow,
  PluginSettingsTitle,
  PluginStatusText,
} from "@curolia/ui/plugin-panel";
import { Switch } from "@curolia/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OsmPoiMapPluginRow } from "./config";
import { isOsmPoiEnabledForMap, OSM_POI_PLUGIN_ID } from "./config";

export function OsmPoiMapSettingsPanel({
  supabase,
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: MapSettingsPanelProps) {
  const qc = useQueryClient();
  const row = jp as OsmPoiMapPluginRow | undefined;
  const enabled = isOsmPoiEnabledForMap(row);

  const saveEnabled = useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      const config = mapPluginConfigRecord(jp);
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: OSM_POI_PLUGIN_ID,
          enabled: nextEnabled,
          config,
          status: "connected",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "map_id,plugin_type_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["map_plugins", mapId] });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error
          ? e.message
          : "Could not update OpenStreetMap settings",
      );
    },
  });

  return (
    <PluginSettingsBox>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="osm-poi-map-enabled">Sync OpenStreetMap data</Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            Fetch nearby OpenStreetMap features for pins on this map.
          </PluginSettingsHint>
        </div>
        <Switch
          id="osm-poi-map-enabled"
          checked={enabled}
          disabled={readOnly || saveEnabled.isPending || !pluginGloballyEnabled}
          onCheckedChange={(c) => void saveEnabled.mutateAsync(c === true)}
        />
      </PluginSettingsRow>
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on OpenStreetMap under Plugins (user menu) to sync place context
          on this map.
        </PluginStatusText>
      ) : null}
    </PluginSettingsBox>
  );
}
