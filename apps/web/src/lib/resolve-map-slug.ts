import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export type ResolvedMapSlug = {
  mapId: string;
  canonicalSlug: string;
  redirected: boolean;
};

/** Resolve a map within an owner profile by current slug or redirect slug. */
export async function resolveMapByOwnerSlug(
  ownerId: string,
  slug: string,
  client: SupabaseClient<Database> = supabase,
): Promise<ResolvedMapSlug | null> {
  const slugNorm = slug.trim().toLowerCase();
  if (!slugNorm) return null;

  const { data: map, error: mapErr } = await client
    .from("maps")
    .select("id, slug")
    .eq("created_by_user_id", ownerId)
    .eq("slug", slugNorm)
    .maybeSingle();
  if (mapErr) throw mapErr;
  if (map) {
    return { mapId: map.id, canonicalSlug: map.slug, redirected: false };
  }

  const { data: redirect, error: redirectErr } = await client
    .from("map_slug_redirects")
    .select("map_id")
    .eq("owner_id", ownerId)
    .eq("slug", slugNorm)
    .maybeSingle();
  if (redirectErr) throw redirectErr;
  if (!redirect) return null;

  const { data: target, error: targetErr } = await client
    .from("maps")
    .select("id, slug")
    .eq("id", redirect.map_id)
    .maybeSingle();
  if (targetErr) throw targetErr;
  if (!target) return null;

  return {
    mapId: target.id,
    canonicalSlug: target.slug,
    redirected: true,
  };
}
