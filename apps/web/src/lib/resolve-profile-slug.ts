import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export type ResolvedProfileSlug = {
  profileId: string;
  canonicalSlug: string;
  redirected: boolean;
};

/** Resolve a profile by current slug or a legacy redirect slug. */
export async function resolveProfileBySlug(
  slug: string,
  client: SupabaseClient<Database> = supabase,
): Promise<ResolvedProfileSlug | null> {
  const slugNorm = slug.trim().toLowerCase();
  if (!slugNorm) return null;

  const { data: profile, error: profileErr } = await client
    .from("profiles")
    .select("id, slug")
    .eq("slug", slugNorm)
    .maybeSingle();
  if (profileErr) throw profileErr;
  if (profile) {
    return {
      profileId: profile.id,
      canonicalSlug: profile.slug,
      redirected: false,
    };
  }

  const { data: redirect, error: redirectErr } = await client
    .from("profile_slug_redirects")
    .select("profile_id")
    .eq("slug", slugNorm)
    .maybeSingle();
  if (redirectErr) throw redirectErr;
  if (!redirect) return null;

  const { data: target, error: targetErr } = await client
    .from("profiles")
    .select("id, slug")
    .eq("id", redirect.profile_id)
    .maybeSingle();
  if (targetErr) throw targetErr;
  if (!target) return null;

  return {
    profileId: target.id,
    canonicalSlug: target.slug,
    redirected: true,
  };
}
