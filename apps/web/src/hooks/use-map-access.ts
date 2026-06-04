import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { MapMemberRole } from "@/types/database";

export function useMapMemberRole(mapId: string | null | undefined) {
  const { user } = useAuth();

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ["map_member_role", mapId, user?.id],
    queryFn: async () => {
      if (!mapId || !user) return null;
      const { data: row, error } = await supabase
        .from("map_members")
        .select("role")
        .eq("map_id", mapId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (row?.role ?? null) as MapMemberRole | null;
    },
    enabled: Boolean(mapId && user),
  });

  return {
    role: data ?? null,
    isLoading,
    isFetched,
    canEdit: data === "owner" || data === "editor",
    isOwner: data === "owner",
    isViewer: data === "viewer",
  };
}

export function useUnreadNotificationsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications_unread", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(userId),
    refetchInterval: 60_000,
  });
}
