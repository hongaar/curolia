import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { resolveMapByOwnerSlug } from "@/lib/resolve-map-slug";
import { resolveProfileBySlug } from "@/lib/resolve-profile-slug";
import type { CuroliaMap } from "@/types/database";

export type MapWithOwnerSlug = CuroliaMap & { owner_profile_slug: string };

export type PublicMapOwnerProfile = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

type DbClient = SupabaseClient<Database>;

export async function fetchPublicMapByRoute(
  profileSlug: string,
  mapSlug: string,
  client: DbClient = supabase,
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
    .eq("is_public", true)
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
  client: DbClient = supabase,
): Promise<PublicMapOwnerProfile | null> {
  const { data: ownerRow, error: memberError } = await client
    .from("map_members")
    .select("user_id")
    .eq("map_id", mapId)
    .eq("role", "owner")
    .maybeSingle();
  if (memberError) throw memberError;
  if (!ownerRow) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("display_name, avatar_url, bio")
    .eq("id", ownerRow.user_id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  return {
    displayName: profile.display_name?.trim() || "Map owner",
    avatarUrl: profile.avatar_url?.trim() || null,
    bio: profile.bio?.trim() || null,
  };
}
