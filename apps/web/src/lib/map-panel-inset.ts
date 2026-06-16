/** Side panel vs bottom sheet — same map pan/restore behavior, different inset axis. */
export type MapPanelLayout = "side" | "bottom";

export const SIDE_PANEL_FALLBACK_WIDTH_PX = 384;

/** Desktop blog panel width (~2/3 viewport) when element is not yet measured. */
export const BLOG_PANEL_FALLBACK_WIDTH_PX =
  typeof window !== "undefined" ? Math.round(window.innerWidth * (2 / 3)) : 853;

/** Matches mobile pin `BottomSheet` `partialHeight="min(85dvh, 40rem)"`. */
export function estimatedBottomSheetHeightPx(
  viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800,
): number {
  return Math.min(viewportHeight * 0.85, 40 * 16);
}

export function measureMapPanelInset(
  layout: MapPanelLayout,
  element: HTMLElement | null | undefined,
): { right?: number; bottom?: number } {
  if (layout === "side") {
    return {
      right: element?.offsetWidth ?? SIDE_PANEL_FALLBACK_WIDTH_PX,
    };
  }
  const measured = element?.getBoundingClientRect().height ?? 0;
  const bottom = measured >= 48 ? measured : estimatedBottomSheetHeightPx();
  return { bottom };
}
