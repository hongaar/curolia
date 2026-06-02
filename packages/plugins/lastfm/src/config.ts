/** Per-map Last.fm plugin row in `map_plugins`. */
export type LastfmMapPluginRow = {
  enabled?: boolean;
};

export const LASTFM_PLUGIN_ID = "lastfm" as const;

/** Last.fm is on for a map unless explicitly disabled on `map_plugins`. */
export function isLastfmEnabledForMap(
  jp: LastfmMapPluginRow | undefined | null,
): boolean {
  if (!jp) return true;
  return jp.enabled !== false;
}
