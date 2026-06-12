/**
 * Generic helpers for `map_plugins.config` JSON (per plugin-type keys).
 */

export type MapPluginLike = {
  /** Per-map plugin toggle (`map_plugins.enabled`). Omitted when no row exists yet. */
  enabled?: boolean;
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

/** Map plugin config: allow signed-out visitors to comment on public maps. */
export const MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_COMMENTS =
  "allowAnonymousComments" as const;

/** Map plugin config: allow signed-out visitors to react on public maps. */
export const MAP_PLUGIN_CONFIG_ALLOW_ANONYMOUS_REACTIONS =
  "allowAnonymousReactions" as const;

export function mapPluginConfigBool(
  config: Record<string, unknown>,
  key: string,
): boolean {
  return config[key] === true;
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
