import { supabase } from "@/lib/supabase";

/** Total map_members rows per map id (owner included). */
export async function fetchMapMemberCounts(
  mapIds: readonly string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(mapIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("map_members")
    .select("map_id")
    .in("map_id", uniqueIds);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const id of uniqueIds) counts.set(id, 0);
  for (const row of data ?? []) {
    counts.set(row.map_id, (counts.get(row.map_id) ?? 0) + 1);
  }
  return counts;
}
