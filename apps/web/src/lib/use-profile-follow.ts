import { fetchProfileFollowStats } from "@/lib/fetch-profile-follow-stats";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useProfileFollow(options: {
  profileId: string;
  profileSlug: string;
  viewerUserId: string | undefined;
  isOwner: boolean;
  isFollowing: boolean;
  enabled: boolean;
}) {
  const {
    profileId,
    profileSlug,
    viewerUserId,
    isOwner,
    isFollowing: initialIsFollowing,
    enabled,
  } = options;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  async function invalidateFollowQueries() {
    await qc.invalidateQueries({
      queryKey: ["public_profile", profileSlug],
    });
    await qc.invalidateQueries({
      queryKey: ["profile_follow_stats", profileId],
    });
    await qc.invalidateQueries({
      queryKey: ["profile_follow_list", profileId],
    });
  }

  async function follow(): Promise<boolean> {
    if (!viewerUserId || isOwner || !enabled) return false;
    setBusy(true);
    const { error } = await supabase.rpc("follow_profile", {
      p_following_id: profileId,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    setIsFollowing(true);
    toast.success("Following");
    await invalidateFollowQueries();
    return true;
  }

  async function unfollow(): Promise<boolean> {
    if (!viewerUserId || isOwner || !enabled) return false;
    setBusy(true);
    const { error } = await supabase.rpc("unfollow_profile", {
      p_following_id: profileId,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    setIsFollowing(false);
    toast.success("Unfollowed");
    await invalidateFollowQueries();
    return true;
  }

  async function toggleFollow(): Promise<boolean> {
    return isFollowing ? unfollow() : follow();
  }

  return {
    isFollowing,
    busy,
    canFollow: Boolean(viewerUserId && !isOwner && enabled),
    follow,
    unfollow,
    toggleFollow,
  };
}

export async function loadProfileFollowStats(
  profileId: string,
  viewerUserId: string | null | undefined,
) {
  return fetchProfileFollowStats(profileId, viewerUserId, supabase);
}
