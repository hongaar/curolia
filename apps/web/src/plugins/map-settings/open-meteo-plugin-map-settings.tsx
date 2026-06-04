import type { Json } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import type { MapPlugin } from "@/types/database";
import { mapPluginConfigRecord } from "@curolia/plugin-contract";
import {
  isOpenMeteoEnabledForMap,
  OPEN_METEO_PLUGIN_ID,
} from "@curolia/plugin-open-meteo";
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

export function OpenMeteoPluginMapSettings({
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
  const enabled = isOpenMeteoEnabledForMap(jp);

  const saveEnabled = useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      const config = mapPluginConfigRecord(jp) as Json;
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: OPEN_METEO_PLUGIN_ID,
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
        e instanceof Error ? e.message : "Could not update weather settings",
      );
    },
  });

  return (
    <PluginSettingsBox>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="open-meteo-map-enabled">
              Show historical weather on pins
            </Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            Pins with a date show weather from{" "}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo
            </a>{" "}
            in the pin subtitle (averaged over multi-day stays). Data is CC BY
            4.0.
          </PluginSettingsHint>
        </div>
        <Switch
          id="open-meteo-map-enabled"
          checked={enabled}
          disabled={readOnly || saveEnabled.isPending || !pluginGloballyEnabled}
          onCheckedChange={(c) => void saveEnabled.mutateAsync(c === true)}
        />
      </PluginSettingsRow>
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on Open-Meteo under Plugins (user menu) to use weather on this
          map.
        </PluginStatusText>
      ) : null}
    </PluginSettingsBox>
  );
}
