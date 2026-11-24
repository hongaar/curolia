import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

type SavedScroll = {
  scrollTop: number;
  /** Anchor attribute value of the topmost visible entry. */
  anchorId?: string;
  /** Anchor top relative to the scroll element's top, in px. */
  anchorOffset?: number;
};

/** Saved scroll per history entry (`location.key`) for the session. */
const savedScroll = new Map<string, SavedScroll>();

const RESTORE_TIMEOUT_MS = 3000;

/**
 * Navigation state for "back" buttons that push the previous URL instead of
 * popping history: restores the scroll position saved for that entry.
 */
export type ScrollRestoreState = { restoreScrollFrom?: string };

export function scrollRestoreState(fromKey: string): ScrollRestoreState {
  return { restoreScrollFrom: fromKey };
}

function captureScroll(el: HTMLElement, anchorAttr?: string): SavedScroll {
  const saved: SavedScroll = { scrollTop: el.scrollTop };
  if (!anchorAttr) return saved;
  const elTop = el.getBoundingClientRect().top;
  for (const node of el.querySelectorAll<HTMLElement>(`[${anchorAttr}]`)) {
    const rect = node.getBoundingClientRect();
    if (rect.bottom > elTop) {
      saved.anchorId = node.getAttribute(anchorAttr) ?? undefined;
      saved.anchorOffset = rect.top - elTop;
      break;
    }
  }
  return saved;
}

function applyScroll(el: HTMLElement, saved: SavedScroll, anchorAttr?: string) {
  if (anchorAttr && saved.anchorId !== undefined) {
    const node = el.querySelector<HTMLElement>(
      `[${anchorAttr}="${CSS.escape(saved.anchorId)}"]`,
    );
    if (node) {
      const delta =
        node.getBoundingClientRect().top -
        el.getBoundingClientRect().top -
        (saved.anchorOffset ?? 0);
      el.scrollTop += delta;
      return;
    }
  }
  el.scrollTop = saved.scrollTop;
}

/**
 * Persists an element's scroll position per history entry and restores it on
 * back/forward navigation (POP) or a back-button push carrying
 * {@link scrollRestoreState}. With `anchorAttr`, restores relative to the
 * topmost visible entry and keeps re-applying while late content (photos,
 * summaries) resizes the list, until the user interacts or a timeout passes.
 */
export function useScrollPositionRestore(
  scrollRef: RefObject<HTMLElement | null>,
  {
    enabled = true,
    anchorAttr,
  }: { enabled?: boolean; anchorAttr?: string } = {},
) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const key = location.key;
  const restoringRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) return;
    const onScroll = () => {
      if (!restoringRef.current)
        savedScroll.set(key, captureScroll(el, anchorAttr));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, key, enabled, anchorAttr]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) return;
    const fromKey =
      navigationType === "POP"
        ? key
        : (location.state as ScrollRestoreState | null)?.restoreScrollFrom;
    if (!fromKey) return;
    const saved = savedScroll.get(fromKey);
    if (!saved || (!saved.scrollTop && !saved.anchorId)) return;
    savedScroll.set(key, saved);

    restoringRef.current = true;
    let done = false;
    const restore = () => applyScroll(el, saved, anchorAttr);
    const finish = () => {
      if (done) return;
      done = true;
      restoringRef.current = false;
      observer.disconnect();
      window.clearTimeout(timeout);
      el.removeEventListener("touchstart", finish);
      el.removeEventListener("wheel", finish);
      savedScroll.set(key, captureScroll(el, anchorAttr));
    };

    const observer = new ResizeObserver(restore);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    const timeout = window.setTimeout(finish, RESTORE_TIMEOUT_MS);
    // User interaction wins over pending restore.
    el.addEventListener("touchstart", finish, { passive: true });
    el.addEventListener("wheel", finish, { passive: true });
    restore();
    return finish;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once per entry
  }, [scrollRef, key, navigationType, enabled, anchorAttr]);
}
