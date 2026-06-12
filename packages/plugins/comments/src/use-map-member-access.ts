import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

type MapMemberAccess = {
  isMember: boolean;
  canModerateComments: boolean;
};

export function useMapMemberAccess(
  supabase: SupabaseClient,
  mapId: string,
  userId?: string | null,
) {
  return useQuery({
    queryKey: ["map_member_access", mapId, userId],
    queryFn: async (): Promise<MapMemberAccess> => {
      if (!userId) {
        return { isMember: false, canModerateComments: false };
      }
      const { data, error } = await supabase
        .from("map_members")
        .select("role")
        .eq("map_id", mapId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      const role = data?.role;
      return {
        isMember: Boolean(data),
        canModerateComments: role === "owner" || role === "editor",
      };
    },
    enabled: Boolean(mapId && userId),
  });
}
