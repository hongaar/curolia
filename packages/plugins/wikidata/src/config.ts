/** Per-map Wikidata row in `map_plugins`. */
export type WikidataMapPluginRow = {
  enabled?: boolean;
};

export const WIKIDATA_PLUGIN_ID = "wikidata" as const;

/** Wikipedia enrichment is on for a map unless explicitly disabled on `map_plugins`. */
export function isWikidataEnabledForMap(
  jp: WikidataMapPluginRow | undefined | null,
): boolean {
  if (!jp) return true;
  return jp.enabled !== false;
}
