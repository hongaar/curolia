import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type FollowStatus = Database["public"]["Enums"]["follow_status"];

export type ProfileFollowStats = {
  followerCount: number;
  followingCount: number;
  /** Viewer's follow of this profile; null when not following. */
  followStatus: FollowStatus | null;
};

type DbClient = SupabaseClient<Database>;

export async function fetchProfileFollowStats(
  profileId: string,
  viewerUserId: string | null | undefined,
  client: DbClient,
): Promise<ProfileFollowStats> {
  const [followerRes, followingRes, statusRes] = await Promise.all([
    client.rpc("profile_follower_count", { p_profile_id: profileId }),
    client.rpc("profile_following_count", { p_profile_id: profileId }),
    viewerUserId && viewerUserId !== profileId
      ? client.rpc("profile_follow_status", { p_following_id: profileId })
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (followerRes.error) throw followerRes.error;
  if (followingRes.error) throw followingRes.error;
  if (statusRes.error) throw statusRes.error;

  return {
    followerCount: Number(followerRes.data ?? 0),
    followingCount: Number(followingRes.data ?? 0),
    followStatus: (statusRes.data as FollowStatus | null) ?? null,
  };
}
