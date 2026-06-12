import {
  MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_REACTIONS,
  mapPluginConfigBool,
  mapPluginConfigRecord,
} from "@curolia/plugin-contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { REACTIONS_PLUGIN_ID } from "./config";
import {
  reactionsMapPluginQueryKey,
  reactionsMapPublicQueryKey,
} from "./query-keys";

type PolicyInput = {
  supabase: SupabaseClient;
  mapId: string;
  userId?: string | null;
  isMapMember: boolean;
};

export function useReactionPolicy({
  supabase,
  mapId,
  isMapMember,
}: PolicyInput) {
  const mapPublicQuery = useQuery({
    queryKey: reactionsMapPublicQueryKey(mapId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maps")
        .select("is_public")
        .eq("id", mapId)
        .maybeSingle();
      if (error) throw error;
      return data?.is_public === true;
    },
    enabled: Boolean(mapId),
  });

  const mapPluginQuery = useQuery({
    queryKey: reactionsMapPluginQueryKey(mapId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("enabled, config")
        .eq("map_id", mapId)
        .eq("plugin_type_id", REACTIONS_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId),
  });

  const config = mapPluginConfigRecord(mapPluginQuery.data);
  const allowAnonymous = mapPluginConfigBool(
    config,
    MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_REACTIONS,
  );
  const isPublic = mapPublicQuery.data === true;

  const canReact = isMapMember || (isPublic && allowAnonymous);

  return {
    canReact,
    allowAnonymous,
    isLoading: mapPublicQuery.isLoading || mapPluginQuery.isLoading,
  };
}
