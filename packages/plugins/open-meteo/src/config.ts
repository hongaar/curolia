/** Per-map Open-Meteo row in `map_plugins`. */
export type OpenMeteoMapPluginRow = {
  enabled?: boolean;
};

export const OPEN_METEO_PLUGIN_ID = "open-meteo" as const;

/** Historical weather is on for a map unless explicitly disabled on `map_plugins`. */
export function isOpenMeteoEnabledForMap(
  jp: OpenMeteoMapPluginRow | undefined | null,
): boolean {
  if (!jp) return true;
  return jp.enabled !== false;
}
