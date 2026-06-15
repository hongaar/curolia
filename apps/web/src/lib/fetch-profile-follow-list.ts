import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type ProfileFollowListUser = {
  profileId: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
};

type DbClient = SupabaseClient<Database>;
type FollowListKind = "followers" | "following";

type FollowListRow = {
  profile_id: string;
  slug: string;
  display_name: string | null;
  avatar_url: string | null;
};

function mapFollowListRow(row: FollowListRow): ProfileFollowListUser {
  return {
    profileId: row.profile_id,
    slug: row.slug,
    displayName: row.display_name?.trim() || row.slug,
    avatarUrl: row.avatar_url?.trim() || null,
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
