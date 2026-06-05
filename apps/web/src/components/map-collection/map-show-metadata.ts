import type { CuroliaMap } from "@/types/database";
import {
  pinMetadataShowSettingsEqual,
  pinMetadataShowSettingsForStorage,
  resolveMapPinMetadataShow,
  type PinMetadataShowSettings,
} from "@curolia/plugin-contract";

export function mapShowMetadataDirty(
  map: CuroliaMap,
  settings: PinMetadataShowSettings,
): boolean {
  const saved = resolveMapPinMetadataShow(map.show_pin_metadata);
  return !pinMetadataShowSettingsEqual(settings, saved);
}

export function mapShowMetadataForSave(
  settings: PinMetadataShowSettings,
): ReturnType<typeof pinMetadataShowSettingsForStorage> {
  return pinMetadataShowSettingsForStorage(settings);
}
