import type { SupabaseClient } from "@supabase/supabase-js";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isOsmPoiEnabledForMap, OSM_POI_PLUGIN_ID } from "./config";
import { osmPoiPluginMeta } from "./plugin-meta";

export function useOsmPoiPluginReady(
  supabase: SupabaseClient,
  args: { mapId: string },
) {
  const mapPluginQuery = useQuery({
    queryKey: ["map_plugins", args.mapId, OSM_POI_PLUGIN_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("enabled, config")
        .eq("map_id", args.mapId)
        .eq("plugin_type_id", OSM_POI_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(args.mapId),
    placeholderData: keepPreviousData,
  });

  const pluginReady =
    isOsmPoiEnabledForMap(mapPluginQuery.data) && osmPoiPluginMeta.implemented;

  return {
    pluginReady,
    mapPluginQuery,
  };
}
