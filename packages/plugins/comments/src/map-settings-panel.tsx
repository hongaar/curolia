import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import {
  MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_COMMENTS,
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
import { COMMENTS_PLUGIN_ID } from "./config";
import { commentsMapPluginQueryKey } from "./query-keys";

export function CommentsMapSettingsPanel({
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
    config[MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_COMMENTS] === true;

  const saveMapPlugin = useMutation({
    mutationFn: async (patch: {
      enabled?: boolean;
      allowAnonymous?: boolean;
    }) => {
      const nextEnabled = patch.enabled ?? enabledOnMap;
      const nextAllowAnonymous = patch.allowAnonymous ?? allowAnonymous;
      const nextConfig = mergeMapPluginConfig(COMMENTS_PLUGIN_ID, config, {
        [MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_COMMENTS]: nextAllowAnonymous,
      });
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: COMMENTS_PLUGIN_ID,
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
        queryKey: commentsMapPluginQueryKey(mapId),
      });
      await qc.invalidateQueries({ queryKey: ["map_plugins", mapId] });
      await qc.invalidateQueries({
        queryKey: ["pin_interaction_plugins", mapId],
      });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error ? e.message : "Could not update comment settings",
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
            <Label htmlFor="comments-enabled-on-map">
              Comments on this map
            </Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            When off, pins on this map do not show comments or the comment form.
          </PluginSettingsHint>
        </div>
        <Switch
          id="comments-enabled-on-map"
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
            <Label htmlFor="comments-allow-anonymous">
              Allow signed-out visitors to comment
            </Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            When enabled on a public map, visitors who are not signed in can
            leave comments. They must enter a display name (remembered on this
            device).
          </PluginSettingsHint>
        </div>
        <Switch
          id="comments-allow-anonymous"
          checked={allowAnonymous}
          disabled={controlsDisabled || !enabledOnMap}
          onCheckedChange={(c) =>
            void saveMapPlugin.mutateAsync({ allowAnonymous: c === true })
          }
        />
      </PluginSettingsRow>
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on Comments under Plugins (user menu) to configure commenting on
          this map.
        </PluginStatusText>
      ) : null}
    </PluginSettingsBox>
  );
}
