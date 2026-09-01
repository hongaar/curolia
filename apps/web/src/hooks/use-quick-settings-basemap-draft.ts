import {
  normalizeMapStyleOptions,
  normalizeMapStylePreset,
  type MapStyleOptions,
  type MapStylePreset,
} from "@/lib/map-style";
import type { CuroliaMap } from "@/types/database";
import { useCallback, useMemo, useState } from "react";

export type MapBasemap = {
  preset: MapStylePreset;
  options: MapStyleOptions;
};

export function basemapFromMap(
  map:
    | Partial<{
        style: string | null;
        style_hillshades: boolean | null;
        style_satellite_labels: boolean | null;
      }>
    | null
    | undefined,
): MapBasemap {
  return {
    preset: normalizeMapStylePreset(map?.style),
    options: normalizeMapStyleOptions(map),
  };
}

/**
 * Live basemap draft for quick settings. Resets synchronously when the active map
 * changes so PinMap never reads a stale preview from the previous map.
 */
export function useQuickSettingsBasemapDraft(
  activeMap: CuroliaMap | null,
  activeMapId: string | null,
): {
  draft: MapBasemap;
  setDraft: (next: MapBasemap) => void;
} {
  const [draftMapId, setDraftMapId] = useState(activeMapId);
  const [draft, setDraft] = useState(() => basemapFromMap(activeMap));

  if (activeMapId !== draftMapId) {
    setDraftMapId(activeMapId);
    setDraft(basemapFromMap(activeMap));
  }

  const setDraftStable = useCallback((next: MapBasemap) => {
    setDraft(next);
  }, []);

  return useMemo(
    () => ({ draft, setDraft: setDraftStable }),
    [draft, setDraftStable],
  );
}

export function resolvePinMapBasemap(args: {
  activeMap:
    | Partial<{
        style: string | null;
        style_hillshades: boolean | null;
        style_satellite_labels: boolean | null;
      }>
    | null
    | undefined;
  quickSettingsStyleActive: boolean;
  draft: MapBasemap;
}): MapBasemap {
  if (args.quickSettingsStyleActive && args.activeMap) {
    return args.draft;
  }
  return basemapFromMap(args.activeMap);
}
