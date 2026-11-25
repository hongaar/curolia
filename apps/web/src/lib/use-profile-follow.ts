import {
  fetchProfileFollowStats,
  type FollowStatus,
} from "@/lib/fetch-profile-follow-stats";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useProfileFollow(options: {
  profileId: string;
  profileSlug: string;
  viewerUserId: string | undefined;
  isOwner: boolean;
  followStatus: FollowStatus | null;
  enabled: boolean;
}) {
  const {
    profileId,
    profileSlug,
    viewerUserId,
    isOwner,
    followStatus: initialStatus,
    enabled,
  } = options;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [statusOverride, setStatusOverride] = useState<
    FollowStatus | null | undefined
  >(undefined);
  const followSyncToken = `${profileId}:${initialStatus}`;
  const [prevFollowSyncToken, setPrevFollowSyncToken] =
    useState(followSyncToken);
  if (followSyncToken !== prevFollowSyncToken) {
    setPrevFollowSyncToken(followSyncToken);
    setStatusOverride(undefined);
  }
  const followStatus =
    statusOverride === undefined ? initialStatus : statusOverride;

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
    const { data, error } = await supabase.rpc("follow_profile", {
      p_following_id: profileId,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    const next = (data as FollowStatus | null) ?? "approved";
    setStatusOverride(next);
    toast.success(next === "pending" ? "Follow request sent" : "Following");
    await invalidateFollowQueries();
    return true;
  }

  async function unfollow(): Promise<boolean> {
    if (!viewerUserId || isOwner || !enabled) return false;
    const wasPending = followStatus === "pending";
    setBusy(true);
    const { error } = await supabase.rpc("unfollow_profile", {
      p_following_id: profileId,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    setStatusOverride(null);
    toast.success(wasPending ? "Follow request canceled" : "Unfollowed");
    await invalidateFollowQueries();
    return true;
  }

  async function toggleFollow(): Promise<boolean> {
    return followStatus ? unfollow() : follow();
  }

  return {
    followStatus,
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
