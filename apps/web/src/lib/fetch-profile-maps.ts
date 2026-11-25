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

  // Public maps, follower-visible unlisted opt-ins, and maps the viewer is a
  // member of (resolved server-side for restricted profiles).
  const { data: ids, error: idsError } = await supabase.rpc(
    "list_profile_map_ids",
    { p_profile_id: profileId },
  );
  if (idsError) throw idsError;
  const mapIds = (ids ?? []) as string[];
  if (mapIds.length === 0) return [];

  const { data, error } = await supabase
    .from("maps")
    .select("*")
    .in("id", mapIds);
  if (error) throw error;
  return finalizeProfileMaps((data ?? []) as CuroliaMap[], profileSlug);
}
