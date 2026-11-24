import { useSyncExternalStore } from "react";

/** Map page publishes its quick-settings opener so the map picker list can host it (mobile). */
export type MapQuickSettingsSlot = { open: () => void };

let current: MapQuickSettingsSlot | null = null;
const listeners = new Set<() => void>();

export function setMapQuickSettingsSlot(slot: MapQuickSettingsSlot | null) {
  current = slot;
  for (const listener of listeners) listener();
}

export function useMapQuickSettingsSlot(): MapQuickSettingsSlot | null {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => current,
    () => null,
  );
}
