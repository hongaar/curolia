import { supabase } from "@/lib/supabase";

export type ResolvedPinSlug = {
  pinId: string;
  canonicalSlug: string;
  redirected: boolean;
};

/** Resolve a pin within a map by current slug or a legacy redirect slug. */
export async function resolvePinByMapSlug(
  mapId: string,
  slug: string,
): Promise<ResolvedPinSlug | null> {
  const slugNorm = slug.trim().toLowerCase();
  if (!slugNorm) return null;

  const { data: pin, error: pinErr } = await supabase
    .from("pins")
    .select("id, slug")
    .eq("map_id", mapId)
    .eq("slug", slugNorm)
    .maybeSingle();
  if (pinErr) throw pinErr;
  if (pin) {
    return { pinId: pin.id, canonicalSlug: pin.slug, redirected: false };
  }

  const { data: redirect, error: redirectErr } = await supabase
    .from("pin_slug_redirects")
    .select("pin_id")
    .eq("map_id", mapId)
    .eq("slug", slugNorm)
    .maybeSingle();
  if (redirectErr) throw redirectErr;
  if (!redirect) return null;

  const { data: target, error: targetErr } = await supabase
    .from("pins")
    .select("id, slug")
    .eq("id", redirect.pin_id)
    .maybeSingle();
  if (targetErr) throw targetErr;
  if (!target) return null;

  return {
    pinId: target.id,
    canonicalSlug: target.slug,
    redirected: true,
  };
}
