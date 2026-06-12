import {
  MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_COMMENTS,
  mapPluginConfigBool,
  mapPluginConfigRecord,
} from "@curolia/plugin-contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { COMMENTS_PLUGIN_ID } from "./config";
import {
  commentsMapPluginQueryKey,
  commentsMapPublicQueryKey,
} from "./query-keys";

type PolicyInput = {
  supabase: SupabaseClient;
  mapId: string;
  userId?: string | null;
  isMapMember: boolean;
};

export function useCommentPolicy({
  supabase,
  mapId,
  userId,
  isMapMember,
}: PolicyInput) {
  const mapPublicQuery = useQuery({
    queryKey: commentsMapPublicQueryKey(mapId),
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
    queryKey: commentsMapPluginQueryKey(mapId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("enabled, config")
        .eq("map_id", mapId)
        .eq("plugin_type_id", COMMENTS_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId),
  });

  const config = mapPluginConfigRecord(mapPluginQuery.data);
  const allowAnonymous = mapPluginConfigBool(
    config,
    MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_COMMENTS,
  );
  const isPublic = mapPublicQuery.data === true;
  const requiresName = !userId;

  const canComment = isMapMember || (isPublic && allowAnonymous);

  const canCommentAnonymously = isPublic && allowAnonymous && !userId;

  return {
    canComment,
    canCommentAnonymously,
    allowAnonymous,
    requiresName,
    isLoading: mapPublicQuery.isLoading || mapPluginQuery.isLoading,
  };
}
