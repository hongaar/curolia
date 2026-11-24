import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** Saved scrollTop per history entry (`location.key`) for the session. */
const savedScrollTop = new Map<string, number>();

const RESTORE_TIMEOUT_MS = 3000;

/**
 * Persists an element's scroll position per history entry and restores it on
 * back/forward navigation (POP), waiting for async content to grow tall enough.
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
    if (!enabled || !el || navigationType !== "POP") return;
    const target = savedScrollTop.get(key);
    if (!target) return;

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
  }, [scrollRef, key, navigationType, enabled]);
}
