import {
  cancelMapPanelPinScrollFollow,
  focusMapPanelPin,
  mapPanelPinHighlightDurationMs,
  type MapPanelPinScrollBehavior,
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
  /** Hash/reload uses instant scroll; map click / search uses smooth. */
  behavior?: MapPanelPinScrollBehavior;
  /** When false, focus retries until pin entries mount (e.g. after map switch). */
  contentReady?: boolean;
};

const FOCUS_RETRY_MS = 50;
const FOCUS_RETRY_MAX_MS = 10_000;

export function useMapPanelPinFocus({
  enabled,
  pinId,
  mode,
  scrollRootRef,
  focusNonce,
  behavior = "smooth",
  contentReady = true,
}: UseMapPanelPinFocusOptions) {
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);
  const [highlightSession, setHighlightSession] = useState(0);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef(mode);
  const behaviorRef = useRef(behavior);
  modeRef.current = mode;
  behaviorRef.current = behavior;

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
    function runFocus(targetPinId: string, started = performance.now()) {
      const scrollRoot = scrollRootRef.current;
      const focused = Boolean(
        scrollRoot &&
        focusMapPanelPin(
          scrollRoot,
          targetPinId,
          modeRef.current,
          behaviorRef.current,
        ),
      );
      if (!focused) {
        if (performance.now() - started < FOCUS_RETRY_MAX_MS) {
          retryTimerRef.current = setTimeout(
            () => runFocus(targetPinId, started),
            FOCUS_RETRY_MS,
          );
        }
        return;
      }

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
    [clearHighlightTimer, scrollRootRef],
  );

  useEffect(() => {
    if (!enabled || !pinId || !contentReady) {
      clearRetryTimer();
      clearHighlightTimer();
      setHighlightedPinId(null);
      const scrollRoot = scrollRootRef.current;
      if (scrollRoot) cancelMapPanelPinScrollFollow(scrollRoot);
      return undefined;
    }
    clearRetryTimer();
    runFocus(pinId);
    return () => {
      clearRetryTimer();
    };
  }, [
    clearHighlightTimer,
    clearRetryTimer,
    contentReady,
    enabled,
    focusNonce,
    pinId,
    runFocus,
    scrollRootRef,
  ]);

  useEffect(() => () => clearHighlightTimer(), [clearHighlightTimer]);

  return { highlightedPinId, highlightSession };
}
