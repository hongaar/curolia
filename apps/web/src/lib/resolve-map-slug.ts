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
): Promise<ResolvedMapSlug | null> {
  const slugNorm = slug.trim().toLowerCase();
  if (!slugNorm) return null;

  const { data: map, error: mapErr } = await supabase
    .from("maps")
    .select("id, slug")
    .eq("created_by_user_id", ownerId)
    .eq("slug", slugNorm)
    .maybeSingle();
  if (mapErr) throw mapErr;
  if (map) {
    return { mapId: map.id, canonicalSlug: map.slug, redirected: false };
  }

  const { data: redirect, error: redirectErr } = await supabase
    .from("map_slug_redirects")
    .select("map_id")
    .eq("owner_id", ownerId)
    .eq("slug", slugNorm)
    .maybeSingle();
  if (redirectErr) throw redirectErr;
  if (!redirect) return null;

  const { data: target, error: targetErr } = await supabase
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

async function routeForMapId(
  mapId: string,
): Promise<{ mapId: string; profileSlug: string; mapSlug: string } | null> {
  const { data: map, error: mapErr } = await supabase
    .from("maps")
    .select("id, slug, created_by_user_id")
    .eq("id", mapId)
    .maybeSingle();
  if (mapErr) throw mapErr;
  if (!map) return null;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", map.created_by_user_id)
    .maybeSingle();
  if (profileErr) throw profileErr;
  if (!profile?.slug) return null;

  return {
    mapId: map.id,
    profileSlug: profile.slug,
    mapSlug: map.slug,
  };
}

/**
 * Legacy `/map/:slug` resolver — globally unique slug before per-owner scoping.
 * Returns null when ambiguous (multiple owners share the same slug string).
 */
export async function resolveLegacyGlobalMapSlug(
  slug: string,
): Promise<{ mapId: string; profileSlug: string; mapSlug: string } | null> {
  const slugNorm = slug.trim().toLowerCase();
  if (!slugNorm) return null;

  const { data: current, error: currentErr } = await supabase
    .from("maps")
    .select("id")
    .eq("slug", slugNorm);
  if (currentErr) throw currentErr;

  if ((current ?? []).length === 1) {
    return routeForMapId(current![0]!.id);
  }

  const { data: redirects, error: redirectErr } = await supabase
    .from("map_slug_redirects")
    .select("map_id")
    .eq("slug", slugNorm);
  if (redirectErr) throw redirectErr;

  const redirectIds = [...new Set((redirects ?? []).map((row) => row.map_id))];
  if ((current ?? []).length === 0 && redirectIds.length === 1) {
    return routeForMapId(redirectIds[0]!);
  }

  return null;
}
