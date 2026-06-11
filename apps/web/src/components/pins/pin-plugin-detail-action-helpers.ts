export function hasPinPluginDetailActions(
  plugins: ReadonlyArray<{ PinDetailAction?: unknown }>,
): boolean {
  return countPinPluginDetailActions(plugins) > 0;
}

export function countPinPluginDetailActions(
  plugins: ReadonlyArray<{ PinDetailAction?: unknown }>,
): number {
  return plugins.filter((plugin) => Boolean(plugin.PinDetailAction)).length;
}
