import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export type ResolvedProfileSlug = {
  profileId: string;
  canonicalSlug: string;
  redirected: boolean;
  visibility: Database["public"]["Enums"]["profile_visibility"];
};

/**
 * Resolve a profile by current slug or a legacy redirect slug. Works for any
 * visibility (slugs are public in map URLs); profile rows stay RLS-gated.
 */
export async function resolveProfileBySlug(
  slug: string,
  client: SupabaseClient<Database> = supabase,
): Promise<ResolvedProfileSlug | null> {
  const slugNorm = slug.trim().toLowerCase();
  if (!slugNorm) return null;

  const { data, error } = await client.rpc("resolve_profile_slug", {
    p_slug: slugNorm,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    profileId: row.profile_id,
    canonicalSlug: row.canonical_slug,
    redirected: row.redirected,
    visibility: row.visibility,
  };
}
