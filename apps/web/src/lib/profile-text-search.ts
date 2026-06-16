import { sanitizeSearchFragment } from "@/lib/pin-text-search";
import { supabase } from "@/lib/supabase";

export type ProfileSearchRow = {
  id: string;
  slug: string;
  display_name: string | null;
  avatar_url: string | null;
  gravatar_hash: string | null;
  is_public: boolean;
};

/** Normalize a toolbar query for profile display-name / handle matching. */
export function normalizeProfileSearchQuery(raw: string): string {
  const q = sanitizeSearchFragment(raw);
  return q.startsWith("@") ? q.slice(1).trim() : q;
}

export function profileSearchTitle(row: ProfileSearchRow): string {
  return row.display_name?.trim() || row.slug;
}

export function profileSearchSubtitle(
  row: ProfileSearchRow,
): string | undefined {
  const slug = row.slug.trim();
  const displayName = row.display_name?.trim();
  if (slug && displayName && slug !== displayName) {
    return `@${slug}`;
  }
  return undefined;
}

export async function searchProfiles(
  query: string,
): Promise<ProfileSearchRow[]> {
  const q = normalizeProfileSearchQuery(query);
  if (q.length < 1) return [];

  const pattern = `%${q}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, slug, display_name, avatar_url, gravatar_hash, is_public")
    .eq("is_public", true)
    .or(`display_name.ilike.${pattern},slug.ilike.${pattern}`)
    .order("display_name", { ascending: true, nullsFirst: false })
    .limit(12);

  if (error) throw error;
  return (data ?? []) as ProfileSearchRow[];
}
