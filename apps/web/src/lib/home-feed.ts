import { publicMapLinkHref } from "@/lib/app-paths";
import { supabase } from "@/lib/supabase";

export type HomeFeedMap = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  icon_emoji: string | null;
  updated_at: string;
  visited_at: string | null;
  owner_profile_slug: string;
  owner_display_name: string | null;
  pin_count: number;
};

type HomeFeedMapRow = {
  map_id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  icon_emoji: string | null;
  updated_at: string;
  visited_at: string | null;
  owner_profile_slug: string;
  owner_display_name: string | null;
  pin_count: number | string;
};

function mapHomeFeedRow(row: HomeFeedMapRow): HomeFeedMap {
  return {
    id: row.map_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    cover_url: row.cover_url,
    icon_emoji: row.icon_emoji,
    updated_at: row.updated_at,
    visited_at: row.visited_at,
    owner_profile_slug: row.owner_profile_slug,
    owner_display_name: row.owner_display_name,
    pin_count: Number(row.pin_count ?? 0),
  };
}

export async function fetchRecentlyVisitedMaps(
  limit = 16,
): Promise<HomeFeedMap[]> {
  const { data, error } = await supabase.rpc("list_recently_visited_maps", {
    p_limit: limit,
  });
  if (error) throw error;
  return ((data ?? []) as HomeFeedMapRow[]).map(mapHomeFeedRow);
}

export async function fetchRecentlyEditedMaps(
  limit = 16,
): Promise<HomeFeedMap[]> {
  const { data, error } = await supabase.rpc("list_recently_edited_maps", {
    p_limit: limit,
  });
  if (error) throw error;
  return ((data ?? []) as HomeFeedMapRow[]).map(mapHomeFeedRow);
}

export async function fetchFollowedRecentPublicMaps(
  limit = 12,
): Promise<HomeFeedMap[]> {
  const { data, error } = await supabase.rpc(
    "list_followed_recent_public_maps",
    { p_limit: limit },
  );
  if (error) throw error;
  return ((data ?? []) as HomeFeedMapRow[]).map(mapHomeFeedRow);
}

export async function fetchDiscoverRecentPublicMaps(
  limit = 12,
): Promise<HomeFeedMap[]> {
  const { data, error } = await supabase.rpc(
    "list_discover_recent_public_maps",
    {
      p_limit: limit,
    },
  );
  if (error) throw error;
  return ((data ?? []) as HomeFeedMapRow[]).map(mapHomeFeedRow);
}

/** Interleave followed and discover maps (~50/50) without duplicates. */
export function mixHomeFeedMaps(
  followed: HomeFeedMap[],
  discover: HomeFeedMap[],
  limit = 24,
): HomeFeedMap[] {
  const seen = new Set<string>();
  const result: HomeFeedMap[] = [];
  let followedIndex = 0;
  let discoverIndex = 0;

  while (result.length < limit) {
    const nextFollowed = followed[followedIndex];
    if (nextFollowed && !seen.has(nextFollowed.id)) {
      result.push(nextFollowed);
      seen.add(nextFollowed.id);
    }
    followedIndex += 1;
    if (result.length >= limit) break;

    const nextDiscover = discover[discoverIndex];
    if (nextDiscover && !seen.has(nextDiscover.id)) {
      result.push(nextDiscover);
      seen.add(nextDiscover.id);
    }
    discoverIndex += 1;

    if (!nextFollowed && !nextDiscover) break;
  }

  return result;
}

export function homeFeedMapHref(map: HomeFeedMap): string {
  return publicMapLinkHref({
    profileSlug: map.owner_profile_slug,
    mapSlug: map.slug,
  });
}

export async function recordMapVisit(mapId: string): Promise<void> {
  const { error } = await supabase.rpc("record_map_visit", {
    p_map_id: mapId,
  });
  if (error) throw error;
}
