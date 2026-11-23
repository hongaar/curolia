import {
  findMapPanelPinElement,
  type MapPanelPinScrollMode,
} from "@/lib/scroll-map-panel-to-pin";
import { isStackRoute } from "@/lib/stack-routes";
import {
  MAP_BLOG_SIDE_PANEL_ANIMATION_MS,
  MAP_PANEL_PIN_HIGHLIGHT_BLEED_PX,
  mapPanelPinHighlightRingClassName,
} from "@curolia/ui/map";
import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

type MapPanelPinHighlightOverlayProps = {
  pinId: string;
  mode: MapPanelPinScrollMode;
  scrollRootRef: RefObject<HTMLElement | null>;
  sidePanelRef?: RefObject<HTMLElement | null>;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function prefersReducedPanelMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isIdentityTransform(transform: string): boolean {
  return transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)";
}

/** True while the blog/gallery panel is still sliding in from the right. */
function isSidePanelEnterAnimating(panel: HTMLElement): boolean {
  return !isIdentityTransform(getComputedStyle(panel).transform);
}

function resolveSidePanel(
  sidePanelRef?: RefObject<HTMLElement | null>,
  scrollRootRef?: RefObject<HTMLElement | null>,
): HTMLElement | null {
  return (
    sidePanelRef?.current ??
    scrollRootRef?.current?.closest("[data-map-content-side-panel]") ??
    null
  );
}

function measureHighlightRect(
  scrollRoot: HTMLElement,
  pinId: string,
  mode: MapPanelPinScrollMode,
): HighlightRect | null {
  const pinElement = findMapPanelPinElement(scrollRoot, pinId, mode);
  if (!pinElement) return null;
  const rect = pinElement.getBoundingClientRect();
  const bleed = MAP_PANEL_PIN_HIGHLIGHT_BLEED_PX;
  return {
    top: rect.top - bleed,
    left: rect.left - bleed,
    width: rect.width + bleed * 2,
    height: rect.height + bleed * 2,
  };
}

function useSidePanelEnterSettled(
  sidePanelRef?: RefObject<HTMLElement | null>,
  scrollRootRef?: RefObject<HTMLElement | null>,
): boolean {
  const [settled, setSettled] = useState(() => {
    if (typeof window === "undefined" || prefersReducedPanelMotion()) {
      return true;
    }
    const panel = resolveSidePanel(sidePanelRef, scrollRootRef);
    return Boolean(panel && !isSidePanelEnterAnimating(panel));
  });

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;
    const finish = () => {
      if (cancelled) return;
      setSettled(true);
    };

    const waitUntilIdle = (panel: HTMLElement) => {
      const tick = () => {
        if (cancelled) return;
        if (!isSidePanelEnterAnimating(panel)) {
          finish();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const attach = () => {
      if (cancelled) return;
      if (prefersReducedPanelMotion()) {
        finish();
        return;
      }
      const panel = resolveSidePanel(sidePanelRef, scrollRootRef);
      if (!panel) {
        raf = requestAnimationFrame(attach);
        return;
      }
      if (isSidePanelEnterAnimating(panel)) {
        waitUntilIdle(panel);
        return;
      }
      finish();
    };

    raf = requestAnimationFrame(attach);

    const fallback = window.setTimeout(
      finish,
      MAP_BLOG_SIDE_PANEL_ANIMATION_MS + 80,
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [scrollRootRef, sidePanelRef]);

  return settled;
}

export function MapPanelPinHighlightOverlay({
  pinId,
  mode,
  scrollRootRef,
  sidePanelRef,
}: MapPanelPinHighlightOverlayProps) {
  const panelSettled = useSidePanelEnterSettled(sidePanelRef, scrollRootRef);
  const [rect, setRect] = useState<HighlightRect | null>(null);

  useLayoutEffect(() => {
    // Render already returns null until the panel settles; `update` re-measures.
    if (!panelSettled) return;

    const scrollRoot = scrollRootRef.current;
    if (!scrollRoot) {
      setRect(null);
      return;
    }

    const update = () => {
      if (isStackRoute(window.location.pathname)) {
        setRect(null);
        return;
      }
      setRect(measureHighlightRect(scrollRoot, pinId, mode));
    };

    update();
    scrollRoot.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const pinElement = findMapPanelPinElement(scrollRoot, pinId, mode);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    resizeObserver?.observe(scrollRoot);
    if (pinElement) resizeObserver?.observe(pinElement);

    return () => {
      scrollRoot.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
    };
  }, [mode, panelSettled, pinId, scrollRootRef]);

  if (!panelSettled || !rect || isStackRoute(window.location.pathname)) {
    return null;
  }

  return createPortal(
    <div
      data-map-panel-pin-highlight
      className={mapPanelPinHighlightRingClassName()}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
      aria-hidden
    />,
    document.body,
  );
}
