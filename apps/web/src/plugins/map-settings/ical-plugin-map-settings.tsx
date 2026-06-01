import type { Json } from "@/lib/database.types";
import { icalFeedPublicUrl } from "@/lib/ical-feed-url";
import { resolveSupabaseUrl } from "@/lib/resolve-supabase-url";
import { supabase } from "@/lib/supabase";
import type { MapPlugin } from "@/types/database";
import {
  mapPluginConfigRecord,
  mergeMapPluginConfig,
} from "@curolia/plugin-contract";
import { ICAL_PLUGIN_ID, parseIcalMapConfig } from "@curolia/plugin-ical";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const supabaseUrl = resolveSupabaseUrl(import.meta.env.VITE_SUPABASE_URL ?? "");

async function ensureIcalFeedToken(mapId: string): Promise<string> {
  const first = await supabase
    .from("map_ical_feed_tokens")
    .select("token")
    .eq("map_id", mapId)
    .maybeSingle();
  if (first.error) throw first.error;
  if (first.data?.token) return first.data.token;

  const ins = await supabase
    .from("map_ical_feed_tokens")
    .insert({ map_id: mapId })
    .select("token")
    .single();
  if (!ins.error && ins.data?.token) return ins.data.token;

  const again = await supabase
    .from("map_ical_feed_tokens")
    .select("token")
    .eq("map_id", mapId)
    .single();
  if (again.error) throw ins.error ?? again.error;
  if (!again.data?.token) throw new Error("Could not create feed token");
  return again.data.token;
}

export function IcalPluginMapSettings({
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
  const parsed = parseIcalMapConfig(mapPluginConfigRecord(jp));

  const tokenQuery = useQuery({
    queryKey: ["map_ical_feed_token", mapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_ical_feed_tokens")
        .select("token")
        .eq("map_id", mapId)
        .maybeSingle();
      if (error) throw error;
      return data?.token ?? null;
    },
    enabled: Boolean(mapId) && pluginGloballyEnabled && parsed.publishFeed,
  });

  const saveConfig = useMutation({
    mutationFn: async (next: { publishFeed: boolean }) => {
      let token: string | null = tokenQuery.data ?? null;
      if (next.publishFeed) {
        token = await ensureIcalFeedToken(mapId);
      }
      const config = mergeMapPluginConfig(
        ICAL_PLUGIN_ID,
        mapPluginConfigRecord(jp),
        {
          publishFeed: next.publishFeed,
        },
      ) as Json;
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
      return { token: next.publishFeed ? token : null };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["map_plugins", mapId] });
      await qc.invalidateQueries({
        queryKey: ["map_ical_feed_token", mapId],
      });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error ? e.message : "Could not update iCalendar settings",
      );
    },
  });

  const feedUrl =
    parsed.publishFeed && tokenQuery.data && supabaseUrl
      ? icalFeedPublicUrl(supabaseUrl, tokenQuery.data)
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
          {tokenQuery.isLoading ? (
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
