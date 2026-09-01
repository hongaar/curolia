import {
  exploreViewportSyncKey,
  quantizeExploreViewport,
} from "@/lib/explore-viewport";
import type { ExploreViewport } from "@/lib/explore-results";
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
  const viewportKey = viewport ? exploreViewportSyncKey(viewport) : "";
  const quantized = useMemo((): ExploreViewport | null => {
    if (!viewport) return null;
    return quantizeExploreViewport(viewport);
  }, [viewport, viewportKey]);
  const syncKey = viewportKey;
  const [debounced, setDebounced] = useState<ExploreViewport | null>(quantized);
  const pendingRef = useRef(quantized);
  pendingRef.current = quantized;
  const appliedKeyRef = useRef(syncKey);
  const initialSetRef = useRef(false);

  useEffect(() => {
    if (!syncKey) {
      initialSetRef.current = false;
      appliedKeyRef.current = "";
      setDebounced(null);
      return;
    }

    if (!initialSetRef.current) {
      initialSetRef.current = true;
      appliedKeyRef.current = syncKey;
      setDebounced(quantized);
      return;
    }

    if (syncKey === appliedKeyRef.current) return;

    const timer = setTimeout(() => {
      appliedKeyRef.current = syncKey;
      setDebounced(pendingRef.current);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs, quantized, syncKey]);

  return debounced;
}
