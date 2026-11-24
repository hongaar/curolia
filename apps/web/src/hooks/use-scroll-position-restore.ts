import { useEffect, useLayoutEffect, type RefObject } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** Topmost visible anchor per history entry (`location.key`). */
type SavedScroll = { scrollTop: number; anchorId?: string; offset: number };
const savedScroll = new Map<string, SavedScroll>();

const RESTORE_TIMEOUT_MS = 3000;

/**
 * Remembers which `[anchorAttr]` entry is at the top of `scrollRef` and brings
 * it back on back/forward navigation. Re-applies while late content (photos,
 * summaries) resizes the list, until the user interacts or a timeout passes.
 */
export function useScrollPositionRestore(
  scrollRef: RefObject<HTMLElement | null>,
  anchorAttr: string,
  enabled = true,
) {
  const { key } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) return;
    const onScroll = () => {
      const top = el.getBoundingClientRect().top;
      const anchor = Array.from(
        el.querySelectorAll<HTMLElement>(`[${anchorAttr}]`),
      ).find((node) => node.getBoundingClientRect().bottom > top);
      savedScroll.set(key, {
        scrollTop: el.scrollTop,
        anchorId: anchor?.getAttribute(anchorAttr) ?? undefined,
        offset: anchor ? anchor.getBoundingClientRect().top - top : 0,
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, key, enabled, anchorAttr]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const saved = savedScroll.get(key);
    if (!enabled || !el || navigationType !== "POP" || !saved) return;

    const restore = () => {
      const anchor =
        saved.anchorId &&
        el.querySelector(`[${anchorAttr}="${CSS.escape(saved.anchorId)}"]`);
      if (anchor) {
        el.scrollTop +=
          anchor.getBoundingClientRect().top -
          el.getBoundingClientRect().top -
          saved.offset;
      } else {
        el.scrollTop = saved.scrollTop;
      }
    };
    const observer = new ResizeObserver(restore);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    const stop = () => observer.disconnect();
    const timeout = window.setTimeout(stop, RESTORE_TIMEOUT_MS);
    // User interaction wins over pending restore.
    el.addEventListener("touchstart", stop, { once: true, passive: true });
    el.addEventListener("wheel", stop, { once: true, passive: true });
    restore();
    return () => {
      stop();
      window.clearTimeout(timeout);
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("wheel", stop);
    };
  }, [scrollRef, key, navigationType, enabled, anchorAttr]);
}
