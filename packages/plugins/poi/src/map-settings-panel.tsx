import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import {
  mapPluginConfigRecord,
  pluginSyncEventsFromConfig,
  withPluginSyncEvents,
  PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED,
} from "@curolia/plugin-contract";
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
import { POI_PLUGIN_ID } from "./config";

export function PoiMapSettingsPanel({
  supabase,
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: MapSettingsPanelProps) {
  const qc = useQueryClient();
  const config = mapPluginConfigRecord(jp);
  const syncEvents = pluginSyncEventsFromConfig(config);
  const autoLookup = syncEvents.includes(
    PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED,
  );

  const toggleAutoLookup = useMutation({
    mutationFn: async (enabled: boolean) => {
      const nextEvents = enabled
        ? [PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED]
        : [];
      const nextConfig = withPluginSyncEvents(config, nextEvents);
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: POI_PLUGIN_ID,
          enabled: true,
          config: nextConfig,
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
          : "Could not update POI auto-lookup setting",
      );
    },
  });

  return (
    <PluginSettingsBox>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="poi-auto-lookup">Auto-lookup nearby places</Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            Automatically look up and attach nearby place information when a
            pin's coordinates change. The closest matching place within range is
            linked.
          </PluginSettingsHint>
        </div>
        <Switch
          id="poi-auto-lookup"
          checked={autoLookup}
          disabled={
            readOnly || toggleAutoLookup.isPending || !pluginGloballyEnabled
          }
          onCheckedChange={(c) => void toggleAutoLookup.mutateAsync(c === true)}
        />
      </PluginSettingsRow>
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on Points of interest under Plugins (user menu) to use POI
          auto-lookup on this map.
        </PluginStatusText>
      ) : null}
    </PluginSettingsBox>
  );
}
