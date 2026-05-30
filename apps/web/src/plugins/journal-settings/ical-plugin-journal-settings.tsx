import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { icalFeedPublicUrl } from "@/lib/ical-feed-url";
import {
  journalPluginConfigRecord,
  mergeJournalPluginConfig,
} from "@curolia/plugin-contract";
import { ICAL_PLUGIN_ID, parseIcalJournalConfig } from "@curolia/plugin-ical";
import type { JournalPlugin } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Label } from "@curolia/ui/label";
import { Switch } from "@curolia/ui/switch";
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
import { Copy } from "lucide-react";
import { toast } from "sonner";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";

async function ensureIcalFeedToken(journalId: string): Promise<string> {
  const first = await supabase
    .from("journal_ical_feed_tokens")
    .select("token")
    .eq("journal_id", journalId)
    .maybeSingle();
  if (first.error) throw first.error;
  if (first.data?.token) return first.data.token;

  const ins = await supabase
    .from("journal_ical_feed_tokens")
    .insert({ journal_id: journalId })
    .select("token")
    .single();
  if (!ins.error && ins.data?.token) return ins.data.token;

  const again = await supabase
    .from("journal_ical_feed_tokens")
    .select("token")
    .eq("journal_id", journalId)
    .single();
  if (again.error) throw ins.error ?? again.error;
  if (!again.data?.token) throw new Error("Could not create feed token");
  return again.data.token;
}

export function IcalPluginJournalSettings({
  journalId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: {
  journalId: string;
  jp: JournalPlugin | undefined;
  pluginGloballyEnabled: boolean;
  readOnly?: boolean;
}) {
  const qc = useQueryClient();
  const parsed = parseIcalJournalConfig(journalPluginConfigRecord(jp));

  const tokenQuery = useQuery({
    queryKey: ["journal_ical_feed_token", journalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_ical_feed_tokens")
        .select("token")
        .eq("journal_id", journalId)
        .maybeSingle();
      if (error) throw error;
      return data?.token ?? null;
    },
    enabled: Boolean(journalId) && pluginGloballyEnabled && parsed.publishFeed,
  });

  const saveConfig = useMutation({
    mutationFn: async (next: { publishFeed: boolean }) => {
      let token: string | null = tokenQuery.data ?? null;
      if (next.publishFeed) {
        token = await ensureIcalFeedToken(journalId);
      }
      const config = mergeJournalPluginConfig(
        ICAL_PLUGIN_ID,
        journalPluginConfigRecord(jp),
        {
          publishFeed: next.publishFeed,
        },
      ) as Json;
      const { error } = await supabase.from("journal_plugins").upsert(
        {
          journal_id: journalId,
          plugin_type_id: ICAL_PLUGIN_ID,
          enabled: true,
          config,
          status: "connected",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "journal_id,plugin_type_id" },
      );
      if (error) throw error;
      return { token: next.publishFeed ? token : null };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["journal_plugins", journalId] });
      await qc.invalidateQueries({
        queryKey: ["journal_ical_feed_token", journalId],
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
          journal.
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
