import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { resolveMapByOwnerSlug } from "@/lib/resolve-map-slug";
import { resolveProfileBySlug } from "@/lib/resolve-profile-slug";
import type { CuroliaMap } from "@/types/database";

export type MapWithOwnerSlug = CuroliaMap & { owner_profile_slug: string };

export type PublicMapOwnerProfile = {
  displayName: string;
  avatarUrl: string | null;
  gravatarHash: string | null;
  bio: string | null;
  profileSlug: string;
};

type DbClient = SupabaseClient<Database>;

export async function fetchPublicMapByRoute(
  profileSlug: string,
  mapSlug: string,
  client: DbClient,
): Promise<MapWithOwnerSlug | null> {
  const profile = await resolveProfileBySlug(profileSlug, client);
  if (!profile) return null;

  const mapMatch = await resolveMapByOwnerSlug(
    profile.profileId,
    mapSlug,
    client,
  );
  if (!mapMatch) return null;

  const { data, error } = await client
    .from("maps")
    .select("*")
    .eq("id", mapMatch.mapId)
    .in("visibility", ["public", "unlisted"])
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    ...(data as CuroliaMap),
    owner_profile_slug: profile.canonicalSlug,
  };
}

export async function fetchPublicMapOwnerProfile(
  mapId: string,
  client: DbClient,
): Promise<PublicMapOwnerProfile | null> {
  const { data, error } = await client.rpc("get_map_owner_card", {
    p_map_id: mapId,
  });
  if (error) throw error;
  const profile = data?.[0];
  if (!profile) return null;

  const profileSlug = profile.slug?.trim() ?? "";
  if (!profileSlug) return null;

  return {
    // Same fallback as the profile page: display name, then slug.
    displayName: profile.display_name?.trim() || profileSlug,
    avatarUrl: profile.avatar_url?.trim() || null,
    gravatarHash: profile.gravatar_hash?.trim() || null,
    bio: profile.bio?.trim() || null,
    profileSlug,
  };
}
