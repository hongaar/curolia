import type { Json } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import type { MapPlugin } from "@/types/database";
import { mapPluginConfigRecord } from "@curolia/plugin-contract";
import {
  isLastfmEnabledForMap,
  LASTFM_PLUGIN_ID,
} from "@curolia/plugin-lastfm";
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

export function LastfmPluginMapSettings({
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: {
  mapId: string;
  jp: MapPlugin | undefined;
  pluginGloballyEnabled: boolean;
  readOnly?: boolean;
}) {
  const qc = useQueryClient();
  const enabled = isLastfmEnabledForMap(jp);

  const saveEnabled = useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      const config = mapPluginConfigRecord(jp) as Json;
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: LASTFM_PLUGIN_ID,
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
        e instanceof Error ? e.message : "Could not update Last.fm settings",
      );
    },
  });

  return (
    <PluginSettingsBox>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="lastfm-map-enabled">Show Last.fm on pins</Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            When enabled, pin pages on this map load your most-scrobbled tracks
            for each pin&apos;s date range.
          </PluginSettingsHint>
        </div>
        <Switch
          id="lastfm-map-enabled"
          checked={enabled}
          disabled={readOnly || saveEnabled.isPending || !pluginGloballyEnabled}
          onCheckedChange={(c) => void saveEnabled.mutateAsync(c === true)}
        />
      </PluginSettingsRow>
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on Last.fm under Plugins (user menu) to use it on this map.
        </PluginStatusText>
      ) : null}
    </PluginSettingsBox>
  );
}
