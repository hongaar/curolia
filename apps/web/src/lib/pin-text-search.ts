import { supabase } from "@/lib/supabase";

export type PinSearchRow = {
  id: string;
  map_id: string;
  slug: string;
  title: string | null;
  description: string | null;
  location_label: string | null;
  lat: number;
  lng: number;
  date: string | null;
};

/** Strip characters that break PostgREST `or()` / `ilike` patterns or add noise. */
export function sanitizeSearchFragment(raw: string): string {
  return raw
    .trim()
    .replace(/[%_,\\]/g, " ")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

export async function searchPinsInMaps(
  mapIds: string[],
  query: string,
): Promise<PinSearchRow[]> {
  const q = sanitizeSearchFragment(query);
  if (q.length < 2 || mapIds.length === 0) return [];

  const pattern = `%${q}%`;
  const { data, error } = await supabase
    .from("pins")
    .select(
      "id, map_id, slug, title, description, location_label, lat, lng, date",
    )
    .in("map_id", mapIds)
    .or(
      `title.ilike.${pattern},description.ilike.${pattern},location_label.ilike.${pattern}`,
    )
    .order("date", { ascending: false, nullsFirst: false })
    .limit(40);

  if (error) throw error;
  return (data ?? []) as PinSearchRow[];
}

export function sortPinsByPreferredMap<
  T extends { map_id: string; date?: string | null },
>(rows: T[], preferredMapId: string | null): T[] {
  return [...rows].sort((a, b) => {
    const ap = preferredMapId && a.map_id === preferredMapId ? 0 : 1;
    const bp = preferredMapId && b.map_id === preferredMapId ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const ad = a.date ?? "";
    const bd = b.date ?? "";
    return bd.localeCompare(ad);
  });
}
