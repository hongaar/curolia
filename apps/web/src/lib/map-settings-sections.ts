export const MAP_SETTINGS_SECTION = {
  general: "map-settings-general",
  sharing: "map-settings-sharing",
  plugin: (pluginId: string) => `map-settings-plugin-${pluginId}`,
} as const;
