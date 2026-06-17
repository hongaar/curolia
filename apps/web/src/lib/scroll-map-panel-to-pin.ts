import {
  MAP_PANEL_PIN_HIGHLIGHT_DURATION_MS,
  MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX,
} from "@curolia/ui/map";

export { MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX };

export type MapPanelPinScrollMode = "blog" | "gallery";

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

export function scrollMapPanelPinIntoView(
  scrollRoot: HTMLElement,
  pinElement: HTMLElement,
  topMarginPx: number = MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX,
): void {
  const rootRect = scrollRoot.getBoundingClientRect();
  const elementRect = pinElement.getBoundingClientRect();
  const delta = elementRect.top - rootRect.top - topMarginPx;
  const targetTop = scrollRoot.scrollTop + delta;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  scrollRoot.scrollTo({
    top: Math.max(0, targetTop),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

export function mapPanelPinHighlightDurationMs(): number {
  return MAP_PANEL_PIN_HIGHLIGHT_DURATION_MS;
}

export function focusMapPanelPin(
  scrollRoot: HTMLElement,
  pinId: string,
  mode: MapPanelPinScrollMode,
): boolean {
  const pinElement = findMapPanelPinElement(scrollRoot, pinId, mode);
  if (!pinElement) return false;
  scrollMapPanelPinIntoView(scrollRoot, pinElement);
  return true;
}
