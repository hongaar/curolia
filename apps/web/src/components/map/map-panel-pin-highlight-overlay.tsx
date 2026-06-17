import {
  findMapPanelPinElement,
  type MapPanelPinScrollMode,
} from "@/lib/scroll-map-panel-to-pin";
import {
  MAP_PANEL_PIN_HIGHLIGHT_BLEED_PX,
  mapPanelPinHighlightRingClassName,
} from "@curolia/ui/map";
import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

type MapPanelPinHighlightOverlayProps = {
  pinId: string;
  mode: MapPanelPinScrollMode;
  scrollRootRef: RefObject<HTMLElement | null>;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

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

export function MapPanelPinHighlightOverlay({
  pinId,
  mode,
  scrollRootRef,
}: MapPanelPinHighlightOverlayProps) {
  const [rect, setRect] = useState<HighlightRect | null>(null);

  useLayoutEffect(() => {
    const scrollRoot = scrollRootRef.current;
    if (!scrollRoot) {
      setRect(null);
      return;
    }

    const update = () => {
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
  }, [mode, pinId, scrollRootRef]);

  if (!rect) return null;

  return createPortal(
    <div
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
