import type { PluginAccountPanelProps } from "@curolia/plugin-contract";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@curolia/ui/button";
import { Input } from "@curolia/ui/input";
import {
  PluginAccountHeading,
  PluginAccountInputRow,
  PluginAccountMuted,
  PluginAccountPanel,
  pluginAccountButtonClass,
  pluginAccountInputClass,
  pluginAccountInputDescriptionClass,
} from "@curolia/ui/plugin-account";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function readUsername(config: unknown): string {
  if (!config || typeof config !== "object") return "";
  const lf = (config as { lastfm?: unknown }).lastfm;
  if (!lf || typeof lf !== "object") return "";
  const u = (lf as { username?: unknown }).username;
  return typeof u === "string" ? u : "";
}

export function LastfmAccountSettingsPanel(props: PluginAccountPanelProps) {
  const {
    pluginTypeId,
    pluginEnabled,
    userPlugin,
    onRefresh,
    supabase,
    userId,
  } = props;

  const [username, setUsername] = useState(() =>
    readUsername(userPlugin?.config),
  );

  useEffect(() => {
    setUsername(readUsername(userPlugin?.config));
  }, [userPlugin?.config]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!supabase || !userId) {
        throw new Error("You must be signed in to save.");
      }
      const trimmed = username.trim();
      const prev =
        userPlugin?.config &&
        typeof userPlugin.config === "object" &&
        userPlugin.config !== null
          ? { ...(userPlugin.config as Record<string, unknown>) }
          : {};
      const next: Record<string, unknown> = {
        ...prev,
        lastfm: trimmed ? { username: trimmed } : {},
      };
      const { error } = await supabase.from("user_plugins").upsert(
        {
          user_id: userId,
          plugin_type_id: pluginTypeId,
          enabled: pluginEnabled,
          config: next,
          status: trimmed ? "connected" : "pending",
        },
        { onConflict: "user_id,plugin_type_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Last.fm username saved.");
      await onRefresh();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    },
  });

  if (!supabase || !userId) {
    return (
      <PluginAccountPanel compact>
        <PluginAccountMuted>Sign in to configure Last.fm.</PluginAccountMuted>
      </PluginAccountPanel>
    );
  }

  return (
    <PluginAccountPanel>
      <PluginAccountHeading>Account</PluginAccountHeading>
      <div className={pluginAccountInputDescriptionClass}>
        <PluginAccountMuted>
          Enter your public Last.fm username. Scrobbles are read from
          Last.fm&apos;s API (full history for the trace dates, subject to API
          limits).
        </PluginAccountMuted>
      </div>
      <PluginAccountInputRow>
        <Input
          id={`lastfm-user-${pluginTypeId}`}
          type="text"
          autoComplete="off"
          placeholder="Last.fm username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={pluginAccountInputClass}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={pluginAccountButtonClass}
          disabled={saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          Save
        </Button>
      </PluginAccountInputRow>
    </PluginAccountPanel>
  );
}
