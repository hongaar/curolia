import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** Saved scrollTop per history entry (`location.key`) for the session. */
const savedScrollTop = new Map<string, number>();

const RESTORE_TIMEOUT_MS = 3000;

/**
 * Navigation state for "back" buttons that push the previous URL instead of
 * popping history: restores the scroll position saved for that entry.
 */
export type ScrollRestoreState = { restoreScrollFrom?: string };

export function scrollRestoreState(fromKey: string): ScrollRestoreState {
  return { restoreScrollFrom: fromKey };
}

/**
 * Persists an element's scroll position per history entry and restores it on
 * back/forward navigation (POP) or a back-button push carrying
 * {@link scrollRestoreState}, waiting for async content to grow tall enough.
 */
export function useScrollPositionRestore(
  scrollRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const key = location.key;
  const restoringRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) return;
    const onScroll = () => {
      if (!restoringRef.current) savedScrollTop.set(key, el.scrollTop);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, key, enabled]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) return;
    const fromKey =
      navigationType === "POP"
        ? key
        : (location.state as ScrollRestoreState | null)?.restoreScrollFrom;
    if (!fromKey) return;
    const target = savedScrollTop.get(fromKey);
    if (!target) return;
    savedScrollTop.set(key, target);

    restoringRef.current = true;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      restoringRef.current = false;
      observer.disconnect();
      window.clearTimeout(timeout);
      el.removeEventListener("touchstart", finish);
      el.removeEventListener("wheel", finish);
    };
    const tryRestore = () => {
      el.scrollTop = target;
      if (Math.abs(el.scrollTop - target) < 1) finish();
    };

    const observer = new ResizeObserver(tryRestore);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    const timeout = window.setTimeout(finish, RESTORE_TIMEOUT_MS);
    // User interaction wins over pending restore.
    el.addEventListener("touchstart", finish, { passive: true });
    el.addEventListener("wheel", finish, { passive: true });
    tryRestore();
    return finish;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once per entry
  }, [scrollRef, key, navigationType, enabled]);
}
