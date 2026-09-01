import type { ExploreViewport } from "@/lib/explore-results";
import {
  exploreViewportSyncKey,
  quantizeExploreViewport,
} from "@/lib/explore-viewport";
import { useEffect, useMemo, useRef, useState } from "react";

/** Delay after last viewport change before explore places refetch. */
export const EXPLORE_VIEWPORT_DEBOUNCE_MS = 450;

/**
 * Debounces explore viewport updates (resize, fit-bounds, pan end) so places
 * requests fire once per gesture, not on every intermediate moveend.
 */
export function useDebouncedExploreViewport(
  viewport: ExploreViewport | null,
  delayMs = EXPLORE_VIEWPORT_DEBOUNCE_MS,
): ExploreViewport | null {
  const syncKey = viewport ? exploreViewportSyncKey(viewport) : "";
  const quantized = useMemo((): ExploreViewport | null => {
    if (!viewport) return null;
    return quantizeExploreViewport(viewport);
  }, [viewport, syncKey]);

  const [debounced, setDebounced] = useState<ExploreViewport | null>(quantized);
  const skipDebounceRef = useRef(true);

  useEffect(() => {
    if (!syncKey) {
      skipDebounceRef.current = true;
      const id = window.setTimeout(() => setDebounced(null), 0);
      return () => window.clearTimeout(id);
    }

    const delay = skipDebounceRef.current ? 0 : delayMs;
    skipDebounceRef.current = false;

    const id = window.setTimeout(() => setDebounced(quantized), delay);
    return () => window.clearTimeout(id);
  }, [syncKey, quantized, delayMs]);

  return debounced;
}
