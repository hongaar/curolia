import {
  flip,
  offset,
  shift,
  size,
  type Middleware,
  type Padding,
} from "@floating-ui/dom";

/** Space from map anchor (marker center) to panel — matches new-pin floating form. */
export const MAP_ANCHOR_PANEL_GAP_PX = 14;

/** Fixed width for the add-pin FAB panel — avoids horizontal shift when results load. */
export const ADD_PIN_PANEL_WIDTH_PX = 352;

const VIEWPORT_EDGE_PX = 12;

function readRootCssLength(varName: string, fallback = 0): number {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.top = "0";
  probe.style.left = "0";
  probe.style.width = "0";
  probe.style.height = `var(${varName}, 0px)`;
  document.documentElement.appendChild(probe);
  const value = probe.getBoundingClientRect().height;
  probe.remove();
  return value || fallback;
}

function readLayerCssLength(layer: Element, varName: string): number {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.top = "0";
  probe.style.left = "0";
  probe.style.width = `var(${varName}, 0px)`;
  layer.appendChild(probe);
  const value = probe.getBoundingClientRect().width;
  layer.removeChild(probe);
  return value;
}

/** Keep map-anchored panels inside the visible map (below toolbar, clear of side sheet). */
export function mapFloatingViewportPadding(): Padding {
  if (typeof window === "undefined") return VIEWPORT_EDGE_PX;

  const layer = document.querySelector("[data-curolia-map-layer]");
  if (layer) {
    const rect = layer.getBoundingClientRect();
    const panelRight = readLayerCssLength(layer, "--map-panel-right");
    const visibleRight = rect.right - panelRight;

    return {
      top: rect.top + VIEWPORT_EDGE_PX,
      right: Math.max(
        VIEWPORT_EDGE_PX,
        window.innerWidth - visibleRight + VIEWPORT_EDGE_PX,
      ),
      bottom: Math.max(
        VIEWPORT_EDGE_PX,
        window.innerHeight - rect.bottom + VIEWPORT_EDGE_PX,
      ),
      left: rect.left + VIEWPORT_EDGE_PX,
    };
  }

  const toolbarOffset = readRootCssLength("--toolbar-offset");
  return {
    top: toolbarOffset + VIEWPORT_EDGE_PX,
    right: readRootCssLength("--safe-right") + VIEWPORT_EDGE_PX,
    bottom: readRootCssLength("--safe-bottom") + VIEWPORT_EDGE_PX,
    left: readRootCssLength("--safe-left") + VIEWPORT_EDGE_PX,
  };
}

/** Floating panel anchored to the add-pin FAB (bottom-right map controls). */
export function mapFabPanelMiddleware(): Middleware[] {
  const padding = mapFloatingViewportPadding();

  return [
    offset(MAP_ANCHOR_PANEL_GAP_PX),
    flip({
      fallbackPlacements: ["left", "left-start", "top-end"],
      padding,
    }),
    shift({ padding, crossAxis: true }),
    size({
      padding,
      apply({ availableHeight, elements }) {
        const maxH = Math.max(200, availableHeight);
        Object.assign(elements.floating.style, {
          maxHeight: `${maxH}px`,
        });
      },
    }),
  ];
}

function normalizePadding(padding: Padding): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof padding === "number") {
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding,
    };
  }
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}

/** Map fly/fit padding that keeps a point clear of a screen-rect (e.g. floating dialog). */
export function mapPaddingAvoidRect(rect: DOMRect | null): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const base = normalizePadding(mapFloatingViewportPadding());
  if (!rect || typeof window === "undefined") return base;

  const edge = 16;
  return {
    top: Math.max(base.top, edge),
    left: Math.max(base.left, edge),
    right: Math.max(base.right, window.innerWidth - rect.left + edge),
    bottom: Math.max(base.bottom, window.innerHeight - rect.top + edge),
  };
}

/** Floating UI middleware for anchored map panels (new pin dialog, marker hover). */
export function mapAnchorPanelMiddleware(): Middleware[] {
  const padding = mapFloatingViewportPadding();

  return [
    offset(MAP_ANCHOR_PANEL_GAP_PX),
    flip({
      fallbackPlacements: ["left", "top", "bottom"],
      padding,
    }),
    shift({ padding, crossAxis: true }),
    size({
      padding,
      apply({ availableHeight, availableWidth, elements }) {
        const maxH = Math.max(140, availableHeight);
        const maxW = Math.min(400, Math.max(288, availableWidth));
        Object.assign(elements.floating.style, {
          maxHeight: `${maxH}px`,
          maxWidth: `${maxW}px`,
        });
      },
    }),
  ];
}
