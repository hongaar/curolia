import type { CuroliaMap } from "@/types/database";
import {
  mapPluginOutputShowDirty,
  mapPluginOutputShowForStorage,
  resolveMapPluginOutputShow,
  type MapPluginOutputShowSettings,
} from "@curolia/plugin-contract";

export function mapShowPluginOutputsDirty(
  map: CuroliaMap,
  settings: MapPluginOutputShowSettings,
): boolean {
  return mapPluginOutputShowDirty(map.show_plugin_outputs, settings);
}

export function mapShowPluginOutputsForSave(
  settings: MapPluginOutputShowSettings,
): ReturnType<typeof mapPluginOutputShowForStorage> {
  return mapPluginOutputShowForStorage(settings);
}

export function resolveMapShowPluginOutputs(
  map: CuroliaMap,
): MapPluginOutputShowSettings {
  return resolveMapPluginOutputShow(map.show_plugin_outputs);
}
