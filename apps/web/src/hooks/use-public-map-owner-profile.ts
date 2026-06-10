import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export type PublicMapOwnerProfile = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

export function usePublicMapOwnerProfile(
  mapId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["public_map_owner", mapId],
    queryFn: async (): Promise<PublicMapOwnerProfile | null> => {
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
        .select("display_name, avatar_url, bio")
        .eq("id", ownerRow.user_id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return null;

      const displayName = profile.display_name?.trim() || "Map owner";
      const avatarUrl = profile.avatar_url?.trim() || null;
      const bio = profile.bio?.trim() || null;

      return { displayName, avatarUrl, bio };
    },
    enabled: Boolean(mapId && enabled),
  });
}
