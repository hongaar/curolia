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
  readWikipediaLanguageSetting,
  WIKIPEDIA_LANGUAGE_OPTIONS,
  type WikipediaLanguageSetting,
} from "./wikipedia-lang";

export function WikidataAccountSettingsPanel(props: PluginAccountPanelProps) {
  const {
    pluginTypeId,
    pluginEnabled,
    userPlugin,
    onRefresh,
    supabase,
    userId,
  } = props;

  const [language, setLanguage] = useState<WikipediaLanguageSetting>(() =>
    readWikipediaLanguageSetting(userPlugin?.config),
  );

  useEffect(() => {
    setLanguage(readWikipediaLanguageSetting(userPlugin?.config));
  }, [userPlugin?.config]);

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
        wikidata: {
          ...((prev.wikidata as Record<string, unknown> | undefined) ?? {}),
          wikipediaLanguage: language,
        },
      };
      const { error } = await supabase.from("user_plugins").upsert(
        {
          user_id: userId,
          plugin_type_id: pluginTypeId,
          enabled: pluginEnabled,
          config: next,
          status: userPlugin?.status ?? "pending",
        },
        { onConflict: "user_id,plugin_type_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Wikipedia language saved.");
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
          Sign in to configure Wikipedia language.
        </PluginAccountMuted>
      </PluginAccountPanel>
    );
  }

  const dirty = language !== readWikipediaLanguageSetting(userPlugin?.config);

  return (
    <PluginAccountPanel>
      <PluginAccountHeading>Wikipedia language</PluginAccountHeading>
      <PluginAccountInputDescription>
        <PluginAccountMuted>
          Choose which Wikipedia to prefer for nearby landmarks and search. Auto
          uses your browser language and the pin&apos;s country when available,
          then falls back to English or any available article.
        </PluginAccountMuted>
      </PluginAccountInputDescription>
      <PluginAccountInputRow>
        <Select
          value={language}
          onValueChange={(value) => {
            if (value) setLanguage(value as WikipediaLanguageSetting);
          }}
        >
          <SelectTrigger aria-label="Wikipedia language">
            <SelectValue>
              {WIKIPEDIA_LANGUAGE_OPTIONS.find((o) => o.value === language)
                ?.label ?? "Auto"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {WIKIPEDIA_LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
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
