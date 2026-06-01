/**
 * Generic helpers for `map_plugins.config` JSON (per plugin-type keys).
 */

export type MapPluginLike = {
  config?: unknown;
};

export function mapPluginConfigRecord(
  jp: MapPluginLike | undefined | null,
): Record<string, unknown> {
  const c = jp?.config;
  if (c && typeof c === "object" && !Array.isArray(c))
    return { ...(c as Record<string, unknown>) };
  return {};
}

/** Shallow merge for `map_plugins.config` updates. */
export function mergeMapPluginConfig(
  _pluginTypeId: string,
  existing: Record<string, unknown> | undefined | null,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...existing }
      : {};
  return { ...base, ...patch };
}
