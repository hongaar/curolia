import { supabase } from "@/lib/supabase";
import type { CuroliaMap } from "@/types/database";

import { fetchMapMemberCounts } from "./fetch-map-member-counts";

async function attachPinCounts<T extends CuroliaMap>(
  maps: T[],
): Promise<Array<T & { pin_count: number }>> {
  const ids = maps.map((map) => map.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("maps")
    .select("id, pins(count)")
    .in("id", ids);
  if (error) throw error;

  const countByMapId = new Map(
    (data ?? []).map((row) => [
      row.id,
      ((row.pins as { count: number }[] | null)?.[0]?.count ?? 0) as number,
    ]),
  );

  return maps.map((map) => ({
    ...map,
    pin_count: countByMapId.get(map.id) ?? 0,
  }));
}

export type ProfileMapCard = CuroliaMap & {
  owner_profile_slug: string;
  pin_count: number;
  member_count: number;
};

function sortMapsByUpdatedAt(maps: ProfileMapCard[]): ProfileMapCard[] {
  return [...maps].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

async function finalizeProfileMaps(
  maps: CuroliaMap[],
  profileSlug: string,
): Promise<ProfileMapCard[]> {
  const withCounts = await attachPinCounts(maps);
  const memberCounts = await fetchMapMemberCounts(
    withCounts.map((map) => map.id),
  );
  return sortMapsByUpdatedAt(
    withCounts.map((map) => ({
      ...map,
      owner_profile_slug: profileSlug,
      member_count: memberCounts.get(map.id) ?? 0,
    })),
  );
}

/** Maps to show on a profile page for the current viewer. */
export async function fetchProfileMaps(
  profileId: string,
  profileSlug: string,
  viewerUserId: string | null,
): Promise<ProfileMapCard[]> {
  const isOwner = viewerUserId === profileId;

  if (isOwner) {
    const { data, error } = await supabase
      .from("maps")
      .select("*")
      .eq("created_by_user_id", profileId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return finalizeProfileMaps((data ?? []) as CuroliaMap[], profileSlug);
  }

  const publicQuery = supabase
    .from("maps")
    .select("*")
    .eq("created_by_user_id", profileId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  if (!viewerUserId) {
    const { data, error } = await publicQuery;
    if (error) throw error;
    return finalizeProfileMaps((data ?? []) as CuroliaMap[], profileSlug);
  }

  const [publicResult, memberResult] = await Promise.all([
    publicQuery,
    supabase.from("map_members").select("maps(*)").eq("user_id", viewerUserId),
  ]);

  if (publicResult.error) throw publicResult.error;
  if (memberResult.error) throw memberResult.error;

  const byId = new Map<string, CuroliaMap>();

  for (const map of publicResult.data ?? []) {
    byId.set(map.id, map as CuroliaMap);
  }

  for (const row of memberResult.data ?? []) {
    const map = row.maps as CuroliaMap | null;
    if (!map || map.created_by_user_id !== profileId) continue;
    byId.set(map.id, map);
  }

  const maps = [...byId.values()];
  return finalizeProfileMaps(maps, profileSlug);
}
