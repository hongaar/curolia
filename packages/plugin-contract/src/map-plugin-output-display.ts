/** Per-map plugin card/subtitle visibility (`maps.show_plugin_outputs` jsonb). */
export type MapPluginOutputShowSettings = Readonly<Record<string, boolean>>;

export function resolveMapPluginOutputShow(
  raw: unknown,
): MapPluginOutputShowSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

/** Default show when the map has no explicit entry for a plugin id. */
export function isPluginOutputShownOnMap(
  settings: MapPluginOutputShowSettings,
  pluginId: string,
): boolean {
  return settings[pluginId] !== false;
}

export function mapPluginOutputShowForStorage(
  settings: MapPluginOutputShowSettings,
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value === false),
  );
}

export function mapPluginOutputShowDirty(
  saved: unknown,
  next: MapPluginOutputShowSettings,
): boolean {
  const a = resolveMapPluginOutputShow(saved);
  const b = mapPluginOutputShowForStorage(next);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return true;
  }
  return false;
}
