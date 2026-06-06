import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import {
  mapPluginConfigRecord,
  mergeMapPluginConfig,
} from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import { Label } from "@curolia/ui/label";
import {
  PluginFeedCode,
  PluginFeedLabel,
  PluginFeedRow,
  PluginSettingsBox,
  PluginSettingsHint,
  PluginSettingsRow,
  PluginSettingsTitle,
  PluginStatusText,
} from "@curolia/ui/plugin-panel";
import { Switch } from "@curolia/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ICAL_PLUGIN_ID, parseIcalMapConfig } from "./config";
import { icalFeedPublicUrl } from "./ical-feed-url";

export function IcalMapSettingsPanel({
  supabase,
  supabaseUrl,
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: MapSettingsPanelProps) {
  const qc = useQueryClient();
  const parsed = parseIcalMapConfig(mapPluginConfigRecord(jp));

  const saveConfig = useMutation({
    mutationFn: async (next: { publishFeed: boolean }) => {
      const existing = mapPluginConfigRecord(jp);
      const feedToken =
        parsed.feedToken ??
        (next.publishFeed ? crypto.randomUUID() : undefined);
      const config = mergeMapPluginConfig(ICAL_PLUGIN_ID, existing, {
        publishFeed: next.publishFeed,
        ...(feedToken ? { feedToken } : {}),
      });
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: ICAL_PLUGIN_ID,
          enabled: true,
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
        e instanceof Error ? e.message : "Could not update iCalendar settings",
      );
    },
  });

  const feedUrl =
    parsed.publishFeed && parsed.feedToken && supabaseUrl
      ? icalFeedPublicUrl(supabaseUrl, parsed.feedToken)
      : null;

  return (
    <PluginSettingsBox>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="ical-publish">Publish as iCalendar file</Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            Anyone with the secret link can subscribe in Apple Calendar, Google
            Calendar, etc. The URL is not guessable.
          </PluginSettingsHint>
        </div>
        <Switch
          id="ical-publish"
          checked={parsed.publishFeed}
          disabled={readOnly || saveConfig.isPending || !pluginGloballyEnabled}
          onCheckedChange={(c) =>
            void saveConfig.mutateAsync({ publishFeed: c === true })
          }
        />
      </PluginSettingsRow>
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on iCalendar under Plugins (user menu) to publish a feed for this
          map.
        </PluginStatusText>
      ) : null}
      {parsed.publishFeed && pluginGloballyEnabled ? (
        <div>
          {saveConfig.isPending ? (
            <PluginStatusText size="sm">Preparing feed URL…</PluginStatusText>
          ) : feedUrl ? (
            <>
              <PluginFeedLabel>Feed URL</PluginFeedLabel>
              <PluginFeedRow>
                <PluginFeedCode>{feedUrl}</PluginFeedCode>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(feedUrl)
                      .then(() => toast.success("Copied feed URL"));
                  }}
                >
                  <Copy />
                  Copy
                </Button>
              </PluginFeedRow>
            </>
          ) : (
            <PluginStatusText size="sm">
              Set up the Supabase project URL in the app environment to show the
              link.
            </PluginStatusText>
          )}
        </div>
      ) : null}
    </PluginSettingsBox>
  );
}
