/** Nominatim `format=jsonv2` search row (subset). */
export type NominatimSearchRow = {
  class?: string;
  category?: string;
  type?: string;
  name?: string;
  extratags?: Record<string, string>;
};

/**
 * Build OSM-style tags from a Nominatim row.
 * Keep in sync with `packages/plugins/poi/supabase/functions/poi/index.ts`
 * (`tagsFromNominatimResult`).
 */
export function tagsFromNominatimRow(
  row: NominatimSearchRow,
): Record<string, string> {
  const tags: Record<string, string> = {};
  const cls = row.class?.trim() || row.category?.trim();
  const type = row.type?.trim();
  if (cls && type) tags[cls] = type;
  const name = row.name?.trim();
  if (name) tags.name = name;
  if (row.extratags && typeof row.extratags === "object") {
    for (const [key, value] of Object.entries(row.extratags)) {
      if (typeof value === "string") tags[key] = value;
    }
  }
  return tags;
}
