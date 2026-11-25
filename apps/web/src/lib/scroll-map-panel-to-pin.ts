import { MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX } from "@curolia/ui/map";

export { MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX };

export type MapPanelPinScrollMode = "blog" | "gallery";
export type MapPanelPinScrollBehavior = "smooth" | "auto";

const PANEL_PIN_SCROLL_SETTLE_MS = 500;
const PANEL_PIN_SCROLL_TRACK_MAX_MS = 10_000;
const PANEL_PIN_SCROLL_TICK_MS = 50;
/** Fallback if `scrollend` never fires. Native panel smooth-scroll is ~800–1400ms. */
const PANEL_PIN_SMOOTH_LOCK_MS = 1_600;
const PANEL_PIN_SCROLLEND_IGNORE_MS = 200;
const LAYOUT_EPSILON_PX = 1;

type ScrollFollow = {
  timer: ReturnType<typeof setTimeout> | null;
  onUserScroll: () => void;
  cleanup?: () => void;
};

const scrollFollowByRoot = new WeakMap<HTMLElement, ScrollFollow>();

function pinSelector(pinId: string, mode: MapPanelPinScrollMode): string {
  const attr = mode === "blog" ? "data-blog-pin-id" : "data-gallery-pin-id";
  return `[${attr}="${CSS.escape(pinId)}"]`;
}

export function findMapPanelPinElement(
  scrollRoot: HTMLElement,
  pinId: string,
  mode: MapPanelPinScrollMode,
): HTMLElement | null {
  const match = scrollRoot.querySelector(pinSelector(pinId, mode));
  return match instanceof HTMLElement ? match : null;
}

/** Line anchor (`data-pin-line-anchor`) + entry for the pin → marker connector. */
export function findMapPanelPinConnectorAnchor(
  scrollRoot: HTMLElement | null,
  pinId: string,
  mode: MapPanelPinScrollMode,
): { lineAnchor: HTMLElement; pinEntry: HTMLElement } | null {
  if (!scrollRoot) return null;
  const pinEntry = findMapPanelPinElement(scrollRoot, pinId, mode);
  const lineAnchor = pinEntry?.querySelector("[data-pin-line-anchor]");
  if (!pinEntry || !(lineAnchor instanceof HTMLElement)) return null;
  return { lineAnchor, pinEntry };
}

export function mapPanelPinScrollTargetTop(
  scrollRoot: HTMLElement,
  pinElement: HTMLElement,
  topMarginPx = MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX,
): number {
  const rootRect = scrollRoot.getBoundingClientRect();
  const elementRect = pinElement.getBoundingClientRect();
  const delta = elementRect.top - rootRect.top - topMarginPx;
  return Math.max(0, scrollRoot.scrollTop + delta);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function cancelScrollFollow(scrollRoot: HTMLElement): void {
  const running = scrollFollowByRoot.get(scrollRoot);
  if (!running) return;
  if (running.timer != null) clearTimeout(running.timer);
  scrollRoot.removeEventListener("wheel", running.onUserScroll);
  scrollRoot.removeEventListener("touchstart", running.onUserScroll);
  running.cleanup?.();
  scrollFollowByRoot.delete(scrollRoot);
}

export function cancelMapPanelPinScrollFollow(scrollRoot: HTMLElement): void {
  cancelScrollFollow(scrollRoot);
}

function nativeScrollTo(
  scrollRoot: HTMLElement,
  top: number,
  smooth: boolean,
): void {
  scrollRoot.scrollTo({
    top: Math.max(0, top),
    behavior: smooth ? "smooth" : "auto",
  });
}

function trackMapPanelPinScroll(
  scrollRoot: HTMLElement,
  pinId: string,
  mode: MapPanelPinScrollMode,
  topMarginPx: number,
  behavior: MapPanelPinScrollBehavior,
): void {
  cancelScrollFollow(scrollRoot);

  const allowSmooth = behavior === "smooth" && !prefersReducedMotion();
  let didSmooth = false;
  let smoothingUntil = 0;
  let ignoreScrollEndUntil = 0;
  let lastDesired = -1;
  let lastScrollHeight = -1;
  let lastShift = performance.now();
  const started = performance.now();

  const follow: ScrollFollow = {
    timer: null,
    onUserScroll: () => cancelScrollFollow(scrollRoot),
  };

  const onImageLoad = (event: Event) => {
    if (!(event.target instanceof HTMLImageElement)) return;
    lastShift = performance.now();
  };

  const onScrollEnd = () => {
    if (performance.now() < ignoreScrollEndUntil) return;
    smoothingUntil = 0;
  };

  const schedule = () => {
    follow.timer = setTimeout(
      () => step(performance.now()),
      PANEL_PIN_SCROLL_TICK_MS,
    );
  };

  const step = (now: number) => {
    if (scrollFollowByRoot.get(scrollRoot) !== follow) return;

    const pinElement = findMapPanelPinElement(scrollRoot, pinId, mode);
    if (!pinElement) {
      if (now - started >= PANEL_PIN_SCROLL_TRACK_MAX_MS) {
        cancelScrollFollow(scrollRoot);
        return;
      }
      schedule();
      return;
    }

    const desired = mapPanelPinScrollTargetTop(
      scrollRoot,
      pinElement,
      topMarginPx,
    );
    const scrollHeight = scrollRoot.scrollHeight;
    const layoutMoved =
      lastDesired < 0 ||
      Math.abs(desired - lastDesired) > LAYOUT_EPSILON_PX ||
      lastScrollHeight < 0 ||
      Math.abs(scrollHeight - lastScrollHeight) > LAYOUT_EPSILON_PX;
    const posDrift =
      Math.abs(scrollRoot.scrollTop - desired) > LAYOUT_EPSILON_PX;
    const canCorrect = now >= smoothingUntil;

    if ((layoutMoved || posDrift) && canCorrect) {
      const smooth = allowSmooth && !didSmooth;
      nativeScrollTo(scrollRoot, desired, smooth);
      if (smooth) {
        didSmooth = true;
        smoothingUntil = now + PANEL_PIN_SMOOTH_LOCK_MS;
        ignoreScrollEndUntil = now + PANEL_PIN_SCROLLEND_IGNORE_MS;
      }
      lastDesired = desired;
      lastScrollHeight = scrollHeight;
      lastShift = now;
    } else if (layoutMoved) {
      lastDesired = desired;
      lastScrollHeight = scrollHeight;
      lastShift = now;
    }

    const settled =
      canCorrect && !posDrift && now - lastShift >= PANEL_PIN_SCROLL_SETTLE_MS;
    if (settled || now - started >= PANEL_PIN_SCROLL_TRACK_MAX_MS) {
      if (posDrift) nativeScrollTo(scrollRoot, desired, false);
      cancelScrollFollow(scrollRoot);
      return;
    }
    schedule();
  };

  scrollRoot.addEventListener("wheel", follow.onUserScroll, { passive: true });
  scrollRoot.addEventListener("touchstart", follow.onUserScroll, {
    passive: true,
  });
  scrollRoot.addEventListener("scrollend", onScrollEnd);
  scrollRoot.addEventListener("load", onImageLoad, true);
  follow.cleanup = () => {
    scrollRoot.removeEventListener("scrollend", onScrollEnd);
    scrollRoot.removeEventListener("load", onImageLoad, true);
  };
  scrollFollowByRoot.set(scrollRoot, follow);
  step(performance.now());
}

export function scrollMapPanelPinIntoView(
  scrollRoot: HTMLElement,
  pinElement: HTMLElement,
  options?: {
    topMarginPx?: number;
  },
): void {
  const topMarginPx =
    options?.topMarginPx ?? MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX;
  const blogPinId = pinElement.getAttribute("data-blog-pin-id");
  if (blogPinId) {
    trackMapPanelPinScroll(
      scrollRoot,
      blogPinId,
      "blog",
      topMarginPx,
      "smooth",
    );
    return;
  }
  const galleryPinId = pinElement.getAttribute("data-gallery-pin-id");
  if (galleryPinId) {
    trackMapPanelPinScroll(
      scrollRoot,
      galleryPinId,
      "gallery",
      topMarginPx,
      "smooth",
    );
    return;
  }

  cancelScrollFollow(scrollRoot);
  nativeScrollTo(
    scrollRoot,
    mapPanelPinScrollTargetTop(scrollRoot, pinElement, topMarginPx),
    !prefersReducedMotion(),
  );
}

export function focusMapPanelPin(
  scrollRoot: HTMLElement,
  pinId: string,
  mode: MapPanelPinScrollMode,
  behavior: MapPanelPinScrollBehavior = "smooth",
): boolean {
  const pinElement = findMapPanelPinElement(scrollRoot, pinId, mode);
  if (!pinElement) return false;
  // Move keyboard focus to the pin's card/title link; scrolling is ours.
  const focusTarget = pinElement.matches("a, button")
    ? pinElement
    : pinElement.querySelector<HTMLElement>("a, button");
  focusTarget?.focus({ preventScroll: true });
  trackMapPanelPinScroll(
    scrollRoot,
    pinId,
    mode,
    MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX,
    behavior,
  );
  return true;
}
