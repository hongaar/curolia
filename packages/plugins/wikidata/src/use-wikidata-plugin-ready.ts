import type { SupabaseClient } from "@supabase/supabase-js";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { wikidataPluginMeta } from "./plugin-meta";

export function useWikidataPluginReady(
  supabase: SupabaseClient,
  args: {
    userId?: string | null;
    mapId: string;
  },
) {
  const pid = wikidataPluginMeta.typeId;

  const userPluginQuery = useQuery({
    queryKey: ["user_plugins", args.userId, pid],
    queryFn: async () => {
      if (!args.userId) return null;
      const { data, error } = await supabase
        .from("user_plugins")
        .select("enabled")
        .eq("user_id", args.userId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(args.userId),
    placeholderData: keepPreviousData,
  });

  const pluginReady =
    Boolean(userPluginQuery.data?.enabled) && wikidataPluginMeta.implemented;

  return {
    pluginReady,
    userPluginQuery,
  };
}
