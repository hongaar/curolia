import { supabase } from "@/lib/supabase";
import { pluginList } from "@/plugins/registry";
import { useAuth } from "@/providers/auth-provider";
import type { UserPlugin } from "@/types/database";
import type { PluginDefinition } from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/** Plugins the user has turned on under Plugins (implemented integrations only). */
export function enabledPluginDefinitions(
  userPlugins: readonly UserPlugin[] | undefined,
): readonly PluginDefinition[] {
  const enabledTypeIds = new Set(
    (userPlugins ?? [])
      .filter((up) => up.enabled)
      .map((up) => up.plugin_type_id),
  );
  return pluginList.filter(
    (plugin) => plugin.implemented && enabledTypeIds.has(plugin.id),
  );
}

export function useEnabledPlugins(options?: { queryEnabled?: boolean }) {
  const { user } = useAuth();
  const fetchEnabled = options?.queryEnabled ?? true;

  const userPluginsQuery = useQuery({
    queryKey: ["user_plugins", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_plugins")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as UserPlugin[];
    },
    enabled: Boolean(user) && fetchEnabled,
  });

  const plugins = useMemo(
    () => enabledPluginDefinitions(userPluginsQuery.data),
    [userPluginsQuery.data],
  );

  return { plugins, userPluginsQuery };
}
