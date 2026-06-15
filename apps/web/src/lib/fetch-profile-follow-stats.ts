import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type ProfileFollowStats = {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

type DbClient = SupabaseClient<Database>;

export async function fetchProfileFollowStats(
  profileId: string,
  viewerUserId: string | null | undefined,
  client: DbClient,
): Promise<ProfileFollowStats> {
  const [followerRes, followingRes, isFollowingRes] = await Promise.all([
    client.rpc("profile_follower_count", { p_profile_id: profileId }),
    client.rpc("profile_following_count", { p_profile_id: profileId }),
    viewerUserId && viewerUserId !== profileId
      ? client.rpc("is_following_profile", { p_following_id: profileId })
      : Promise.resolve({ data: false, error: null }),
  ]);

  if (followerRes.error) throw followerRes.error;
  if (followingRes.error) throw followingRes.error;
  if (isFollowingRes.error) throw isFollowingRes.error;

  return {
    followerCount: Number(followerRes.data ?? 0),
    followingCount: Number(followingRes.data ?? 0),
    isFollowing: Boolean(isFollowingRes.data),
  };
}
