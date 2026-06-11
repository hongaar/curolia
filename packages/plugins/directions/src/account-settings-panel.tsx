import type { PluginAccountPanelProps } from "@curolia/plugin-contract";
import {
  PluginAccountButton,
  PluginAccountHeading,
  PluginAccountInputDescription,
  PluginAccountInputRow,
  PluginAccountMuted,
  PluginAccountPanel,
} from "@curolia/ui/plugin-account";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@curolia/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DIRECTIONS_PROVIDER_LABELS,
  DIRECTIONS_PROVIDERS,
  parseDirectionsUserConfig,
  type DirectionsProvider,
} from "./config";

export function DirectionsAccountSettingsPanel(props: PluginAccountPanelProps) {
  const {
    pluginTypeId,
    pluginEnabled,
    userPlugin,
    onRefresh,
    supabase,
    userId,
  } = props;

  const savedProvider = parseDirectionsUserConfig(userPlugin?.config).provider;
  const [provider, setProvider] = useState<DirectionsProvider>(savedProvider);

  useEffect(() => {
    setProvider(savedProvider);
  }, [savedProvider]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!supabase || !userId) {
        throw new Error("You must be signed in to save.");
      }
      const prev =
        userPlugin?.config &&
        typeof userPlugin.config === "object" &&
        userPlugin.config !== null
          ? { ...(userPlugin.config as Record<string, unknown>) }
          : {};
      const next: Record<string, unknown> = {
        ...prev,
        directions: { provider },
      };
      const { error } = await supabase.from("user_plugins").upsert(
        {
          user_id: userId,
          plugin_type_id: pluginTypeId,
          enabled: pluginEnabled,
          config: next,
          status: "connected",
        },
        { onConflict: "user_id,plugin_type_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Navigation app saved.");
      await onRefresh();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    },
  });

  if (!supabase || !userId) {
    return (
      <PluginAccountPanel compact>
        <PluginAccountMuted>
          Sign in to choose a map provider.
        </PluginAccountMuted>
      </PluginAccountPanel>
    );
  }

  const dirty = provider !== savedProvider;

  return (
    <PluginAccountPanel>
      <PluginAccountHeading>Navigation app</PluginAccountHeading>
      <PluginAccountInputDescription>
        <PluginAccountMuted>
          Opens turn-by-turn directions to each pin in your chosen map app.
        </PluginAccountMuted>
      </PluginAccountInputDescription>
      <PluginAccountInputRow>
        <Select
          value={provider}
          onValueChange={(value) => {
            if (value) setProvider(value as DirectionsProvider);
          }}
        >
          <SelectTrigger aria-label="Map provider for directions">
            <SelectValue>{DIRECTIONS_PROVIDER_LABELS[provider]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DIRECTIONS_PROVIDERS.map((item) => (
              <SelectItem key={item} value={item}>
                {DIRECTIONS_PROVIDER_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PluginAccountButton
          type="button"
          disabled={saveMut.isPending || !dirty}
          onClick={() => saveMut.mutate()}
        >
          Save
        </PluginAccountButton>
      </PluginAccountInputRow>
    </PluginAccountPanel>
  );
}
