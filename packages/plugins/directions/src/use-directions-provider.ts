import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import {
  DIRECTIONS_PLUGIN_ID,
  parseDirectionsUserConfig,
  type DirectionsUserConfig,
} from "./config";

export function directionsProviderQueryKey(userId: string | null | undefined) {
  return ["user_plugins", userId, DIRECTIONS_PLUGIN_ID, "provider"] as const;
}

export function useDirectionsProvider(args: {
  supabase?: SupabaseClient;
  userId?: string | null;
}): DirectionsUserConfig {
  const query = useQuery({
    queryKey: directionsProviderQueryKey(args.userId),
    queryFn: async () => {
      if (!args.supabase || !args.userId) {
        return parseDirectionsUserConfig(null);
      }
      const { data, error } = await args.supabase
        .from("user_plugins")
        .select("config")
        .eq("user_id", args.userId)
        .eq("plugin_type_id", DIRECTIONS_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return parseDirectionsUserConfig(data?.config);
    },
    enabled: Boolean(args.supabase && args.userId),
  });

  return query.data ?? parseDirectionsUserConfig(null);
}
