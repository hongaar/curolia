import {
  focusMapPanelPin,
  mapPanelPinHighlightDurationMs,
  type MapPanelPinScrollMode,
} from "@/lib/scroll-map-panel-to-pin";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

type UseMapPanelPinFocusOptions = {
  enabled: boolean;
  pinId: string | null | undefined;
  mode: MapPanelPinScrollMode;
  scrollRootRef: RefObject<HTMLElement | null>;
  /** Bumps when the same pin should be focused again (e.g. repeat search pick). */
  focusNonce: number;
  /** When false, focus retries until pin entries mount (e.g. after map switch). */
  contentReady?: boolean;
};

export function useMapPanelPinFocus({
  enabled,
  pinId,
  mode,
  scrollRootRef,
  focusNonce,
  contentReady = true,
}: UseMapPanelPinFocusOptions) {
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);
  const [highlightSession, setHighlightSession] = useState(0);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHighlightTimer = useCallback(() => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const runFocus = useCallback(
    (targetPinId: string, attempt = 0) => {
      const scrollRoot = scrollRootRef.current;
      if (!scrollRoot) return;

      const focused = focusMapPanelPin(scrollRoot, targetPinId, mode);
      if (!focused && attempt < 24) {
        retryTimerRef.current = setTimeout(
          () => runFocus(targetPinId, attempt + 1),
          75,
        );
        return;
      }
      if (!focused) return;

      setHighlightedPinId(targetPinId);
      setHighlightSession((session) => session + 1);
      clearHighlightTimer();
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedPinId((current) =>
          current === targetPinId ? null : current,
        );
        highlightTimerRef.current = null;
      }, mapPanelPinHighlightDurationMs());
    },
    [clearHighlightTimer, mode, scrollRootRef],
  );

  useEffect(() => {
    if (!enabled || !pinId || !contentReady) return undefined;
    clearRetryTimer();
    runFocus(pinId);
    return () => {
      clearRetryTimer();
    };
  }, [clearRetryTimer, contentReady, enabled, focusNonce, pinId, runFocus]);

  useEffect(() => () => clearHighlightTimer(), [clearHighlightTimer]);

  return { highlightedPinId, highlightSession };
}
