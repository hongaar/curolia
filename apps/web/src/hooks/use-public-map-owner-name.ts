import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export function usePublicMapOwnerName(
  mapId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["public_map_owner", mapId],
    queryFn: async () => {
      if (!mapId) return null;
      const { data: ownerRow, error: memberError } = await supabase
        .from("map_members")
        .select("user_id")
        .eq("map_id", mapId)
        .eq("role", "owner")
        .maybeSingle();
      if (memberError) throw memberError;
      if (!ownerRow) return null;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", ownerRow.user_id)
        .maybeSingle();
      if (profileError) throw profileError;

      const name = profile?.display_name?.trim();
      return name || "Map owner";
    },
    enabled: Boolean(mapId && enabled),
  });
}
