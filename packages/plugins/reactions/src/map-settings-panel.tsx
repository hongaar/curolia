import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import {
  MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_REACTIONS,
  mapPluginConfigRecord,
  mergeMapPluginConfig,
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
import { REACTIONS_PLUGIN_ID } from "./config";
import { reactionsMapPluginQueryKey } from "./query-keys";

export function ReactionsMapSettingsPanel({
  supabase,
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: MapSettingsPanelProps) {
  const qc = useQueryClient();
  const config = mapPluginConfigRecord(jp);
  const enabledOnMap = jp == null ? true : jp.enabled;
  const allowAnonymous =
    config[MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_REACTIONS] === true;

  const saveMapPlugin = useMutation({
    mutationFn: async (patch: {
      enabled?: boolean;
      allowAnonymous?: boolean;
    }) => {
      const nextEnabled = patch.enabled ?? enabledOnMap;
      const nextAllowAnonymous = patch.allowAnonymous ?? allowAnonymous;
      const nextConfig = mergeMapPluginConfig(REACTIONS_PLUGIN_ID, config, {
        [MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_REACTIONS]: nextAllowAnonymous,
      });
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: REACTIONS_PLUGIN_ID,
          enabled: nextEnabled,
          config: nextConfig,
          status: "connected",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "map_id,plugin_type_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: reactionsMapPluginQueryKey(mapId),
      });
      await qc.invalidateQueries({ queryKey: ["map_plugins", mapId] });
      await qc.invalidateQueries({
        queryKey: ["map_scoped_plugin_enabled", mapId],
      });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error ? e.message : "Could not update reaction settings",
      );
    },
  });

  const controlsDisabled =
    readOnly || saveMapPlugin.isPending || !pluginGloballyEnabled;

  return (
    <PluginSettingsBox>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="reactions-enabled-on-map">
              Reactions on this map
            </Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            When off, pins on this map do not show reactions or the reaction
            picker.
          </PluginSettingsHint>
        </div>
        <Switch
          id="reactions-enabled-on-map"
          checked={enabledOnMap}
          disabled={controlsDisabled}
          onCheckedChange={(c) =>
            void saveMapPlugin.mutateAsync({ enabled: c === true })
          }
        />
      </PluginSettingsRow>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="reactions-allow-anonymous">
              Allow signed-out visitors to react
            </Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            When enabled on a public map, visitors who are not signed in can add
            emoji reactions to pins.
          </PluginSettingsHint>
        </div>
        <Switch
          id="reactions-allow-anonymous"
          checked={allowAnonymous}
          disabled={controlsDisabled || !enabledOnMap}
          onCheckedChange={(c) =>
            void saveMapPlugin.mutateAsync({ allowAnonymous: c === true })
          }
        />
      </PluginSettingsRow>
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on Reactions under Plugins (user menu) to configure reactions on
          this map.
        </PluginStatusText>
      ) : null}
    </PluginSettingsBox>
  );
}
