import type { PluginDefinition, PluginPinOutputScope } from "./definition";

/** Default pin output scope when a plugin exposes {@link PluginDefinition.PinDetailSection}. */
export const DEFAULT_PIN_OUTPUT_SCOPE: PluginPinOutputScope = "map";

export function resolvePinOutputScope(
  plugin: Pick<PluginDefinition, "pinOutputScope" | "PinDetailSection">,
): PluginPinOutputScope | null {
  if (!plugin.PinDetailSection) return null;
  return plugin.pinOutputScope ?? DEFAULT_PIN_OUTPUT_SCOPE;
}

export function isMapScopedPinOutput(
  plugin: Pick<PluginDefinition, "pinOutputScope" | "PinDetailSection">,
): boolean {
  return resolvePinOutputScope(plugin) === "map";
}

export function isViewerScopedPinOutput(
  plugin: Pick<PluginDefinition, "pinOutputScope" | "PinDetailSection">,
): boolean {
  return resolvePinOutputScope(plugin) === "viewer";
}

/** Map-scoped readable output (detail section, interaction section, or subtitle-only). */
export function hasMapScopedReadableOutput(
  plugin: Pick<
    PluginDefinition,
    "pinOutputScope" | "PinDetailSection" | "PinInteractionSection"
  >,
): boolean {
  if (plugin.pinOutputScope === "viewer") return false;
  if (plugin.PinDetailSection) return true;
  if (plugin.PinInteractionSection) return true;
  return plugin.pinOutputScope === "map";
}

/** Plugins whose map-scoped output can be toggled per map (`maps.show_plugin_outputs`). */
export function isMapOutputToggleablePlugin(
  plugin: Pick<
    PluginDefinition,
    | "implemented"
    | "pinOutputScope"
    | "PinDetailSection"
    | "PinInteractionSection"
  >,
): boolean {
  return plugin.implemented && hasMapScopedReadableOutput(plugin);
}
