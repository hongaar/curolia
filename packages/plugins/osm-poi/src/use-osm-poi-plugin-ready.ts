import type { SupabaseClient } from "@supabase/supabase-js";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { OSM_POI_PLUGIN_ID } from "./config";
import { osmPoiPluginMeta } from "./plugin-meta";

export function useOsmPoiPluginReady(
  supabase: SupabaseClient,
  args: {
    userId?: string | null;
    mapId: string;
  },
) {
  const userPluginQuery = useQuery({
    queryKey: ["user_plugins", args.userId, OSM_POI_PLUGIN_ID],
    queryFn: async () => {
      if (!args.userId) return null;
      const { data, error } = await supabase
        .from("user_plugins")
        .select("enabled")
        .eq("user_id", args.userId)
        .eq("plugin_type_id", OSM_POI_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(args.userId),
    placeholderData: keepPreviousData,
  });

  const pluginReady =
    Boolean(userPluginQuery.data?.enabled) && osmPoiPluginMeta.implemented;

  return {
    pluginReady,
    userPluginQuery,
  };
}
