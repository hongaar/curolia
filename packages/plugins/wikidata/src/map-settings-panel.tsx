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
import type { WikidataMapPluginRow } from "./config";
import { isWikidataEnabledForMap, WIKIDATA_PLUGIN_ID } from "./config";

export function WikidataMapSettingsPanel({
  supabase,
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: MapSettingsPanelProps) {
  const qc = useQueryClient();
  const enabled = isWikidataEnabledForMap(
    jp as WikidataMapPluginRow | undefined,
  );

  const saveEnabled = useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      const config = mapPluginConfigRecord(jp);
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: WIKIDATA_PLUGIN_ID,
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
          : "Could not update Wikipedia enrichment settings",
      );
    },
  });

  return (
    <PluginSettingsBox>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="wikidata-map-enabled">
              Show nearby Wikipedia articles on pins
            </Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            Pins with coordinates show a short extract from the nearest notable
            place on Wikipedia.
          </PluginSettingsHint>
        </div>
        <Switch
          id="wikidata-map-enabled"
          checked={enabled}
          disabled={readOnly || saveEnabled.isPending || !pluginGloballyEnabled}
          onCheckedChange={(c) => void saveEnabled.mutateAsync(c === true)}
        />
      </PluginSettingsRow>
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on Wikipedia under Plugins (user menu) to use enrichment on this
          map.
        </PluginStatusText>
      ) : null}
    </PluginSettingsBox>
  );
}
