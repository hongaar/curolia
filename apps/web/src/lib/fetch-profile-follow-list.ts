import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type ProfileFollowListUser = {
  profileId: string;
  slug: string | null;
  displayName: string;
  avatarUrl: string | null;
  gravatarHash: string | null;
  isPrivate: boolean;
};

type DbClient = SupabaseClient<Database>;
type FollowListKind = "followers" | "following";

type FollowListRow = {
  profile_id: string;
  slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  gravatar_hash: string | null;
  is_private: boolean;
};

function mapFollowListRow(row: FollowListRow): ProfileFollowListUser {
  return {
    profileId: row.profile_id,
    slug: row.slug?.trim() || null,
    displayName: row.display_name?.trim() || "Unknown",
    avatarUrl: row.avatar_url?.trim() || null,
    gravatarHash: row.gravatar_hash?.trim() || null,
    isPrivate: row.is_private,
  };
}

export async function fetchProfileFollowList(
  profileId: string,
  kind: FollowListKind,
  client: DbClient,
): Promise<ProfileFollowListUser[]> {
  const rpc =
    kind === "followers" ? "list_profile_followers" : "list_profile_following";
  const { data, error } = await client.rpc(rpc, {
    p_profile_id: profileId,
  });
  if (error) throw error;
  return ((data ?? []) as FollowListRow[]).map(mapFollowListRow);
}
