import type { PinMapHandle } from "@/components/map/pin-map";
import {
  MapBlogPinConnectorInPanel,
  MapBlogPinConnectorMap,
} from "@curolia/ui/map";
import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

/** Radius to stop the map segment before the marker center so the pin sits on top. */
const MARKER_LINE_INSET_PX = 18;
/** Gap between the panel line start and pin content. */
const PANEL_LINE_CONTENT_GAP_PX = 12;
/** Offset below the scroll viewport top when the line anchor is offscreen. */
const PANEL_LINE_TOP_INSET_PX = 16;

export type MapPanelPinConnectorAnchor = {
  /** Element whose left edge and vertical position anchor the line (title, card, …). */
  lineAnchor: HTMLElement;
  /** Pin row/card container used to clamp the anchor while scrolling. */
  pinEntry: HTMLElement;
};

type MapPanelPinConnectorOverlayProps = {
  show: boolean;
  pinLng: number;
  pinLat: number;
  anchorRef: RefObject<MapPanelPinConnectorAnchor | null>;
  scrollRootRef: RefObject<HTMLElement | null>;
  sidePanelRef: RefObject<HTMLElement | null>;
  mapRef: RefObject<PinMapHandle | null>;
};

type ConnectorSegments = {
  panel: { x1: number; y1: number; x2: number; y2: number };
  map: { x1: number; y1: number; x2: number; y2: number };
};

function splitConnectorAtPanelEdge(
  anchorX: number,
  anchorY: number,
  markerX: number,
  markerY: number,
  panelLeft: number,
): { splitX: number; splitY: number } {
  const dx = markerX - anchorX;
  if (Math.abs(dx) < 1) {
    return { splitX: panelLeft, splitY: anchorY };
  }
  const t = (panelLeft - anchorX) / dx;
  return {
    splitX: panelLeft,
    splitY: anchorY + t * (markerY - anchorY),
  };
}

function shortenToward(
  fromX: number,
  fromY: number,
  towardX: number,
  towardY: number,
  insetPx: number,
): { x: number; y: number } {
  const dx = towardX - fromX;
  const dy = towardY - fromY;
  const len = Math.hypot(dx, dy);
  if (len <= insetPx) return { x: fromX, y: fromY };
  const f = insetPx / len;
  return { x: fromX + dx * f, y: fromY + dy * f };
}

function toMapLocal(
  viewportX: number,
  viewportY: number,
  containerRect: DOMRect,
): { x: number; y: number } {
  return {
    x: viewportX - containerRect.left,
    y: viewportY - containerRect.top,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computePanelLineAnchor(
  lineAnchor: HTMLElement,
  pinEntry: HTMLElement,
  scrollRoot: HTMLElement | null,
): { x: number; y: number } {
  const lineRect = lineAnchor.getBoundingClientRect();
  const pinRect = pinEntry.getBoundingClientRect();
  const scrollRect = scrollRoot?.getBoundingClientRect();

  const visibleTop = scrollRect?.top ?? 0;
  const visibleBottom = scrollRect?.bottom ?? window.innerHeight;
  const lockedTopY = visibleTop + PANEL_LINE_TOP_INSET_PX;

  const pinVisibleBottom = Math.min(pinRect.bottom, visibleBottom);
  const lineCenterY = lineRect.top + lineRect.height / 2;
  const lineOffscreenAbove =
    lineRect.bottom <= visibleTop || lineCenterY < lockedTopY;

  let anchorY: number;
  if (lineOffscreenAbove) {
    anchorY = lockedTopY;
  } else {
    const pinVisibleTop = Math.max(pinRect.top, visibleTop);
    anchorY =
      pinVisibleBottom > pinVisibleTop
        ? clamp(lineCenterY, lockedTopY, pinVisibleBottom)
        : lineCenterY;
  }

  return {
    x: lineRect.left - PANEL_LINE_CONTENT_GAP_PX,
    y: anchorY,
  };
}

/** Draws a line from a map side-panel pin to its map marker while hovered. */
export function MapPanelPinConnectorOverlay({
  show,
  pinLng,
  pinLat,
  anchorRef,
  scrollRootRef,
  sidePanelRef,
  mapRef,
}: MapPanelPinConnectorOverlayProps) {
  const [segments, setSegments] = useState<ConnectorSegments | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLElement | null>(null);
  const [sidePanelEl, setSidePanelEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!show) return;

    const update = () => {
      const anchor = anchorRef.current;
      const map = mapRef.current;
      const container = map?.getMapContainer() ?? null;
      const sidePanel = sidePanelRef.current;
      if (!anchor || !map || !container || !sidePanel) {
        setSegments(null);
        setMapContainer(null);
        setSidePanelEl(null);
        return;
      }

      const screen = map.lngLatToScreen(pinLng, pinLat);
      if (!screen) {
        setSegments(null);
        setMapContainer(null);
        setSidePanelEl(null);
        return;
      }

      const { x: anchorX, y: anchorY } = computePanelLineAnchor(
        anchor.lineAnchor,
        anchor.pinEntry,
        scrollRootRef.current,
      );

      const panelLeft =
        sidePanelRef.current?.getBoundingClientRect().left ?? anchorX - 1;

      const { splitX, splitY } = splitConnectorAtPanelEdge(
        anchorX,
        anchorY,
        screen.x,
        screen.y,
        panelLeft,
      );

      const markerEnd = shortenToward(
        screen.x,
        screen.y,
        splitX,
        splitY,
        MARKER_LINE_INSET_PX,
      );

      const containerRect = container.getBoundingClientRect();
      const splitLocal = toMapLocal(splitX, splitY, containerRect);
      const markerLocal = toMapLocal(markerEnd.x, markerEnd.y, containerRect);

      setMapContainer(container);
      setSidePanelEl(sidePanel);
      setSegments({
        panel: { x1: anchorX, y1: anchorY, x2: splitX, y2: splitY },
        map: {
          x1: splitLocal.x,
          y1: splitLocal.y,
          x2: markerLocal.x,
          y2: markerLocal.y,
        },
      });
    };

    update();
    const unsubCamera = mapRef.current?.subscribeCamera(update) ?? (() => {});
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      unsubCamera();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [show, pinLng, pinLat, anchorRef, scrollRootRef, sidePanelRef, mapRef]);

  if (!show || !segments) return null;

  const panelSegment = (
    <MapBlogPinConnectorInPanel
      x1={segments.panel.x1}
      y1={segments.panel.y1}
      x2={segments.panel.x2}
      y2={segments.panel.y2}
    />
  );

  return (
    <>
      {sidePanelEl ? createPortal(panelSegment, sidePanelEl) : null}
      {mapContainer
        ? createPortal(
            <MapBlogPinConnectorMap
              x1={segments.map.x1}
              y1={segments.map.y1}
              x2={segments.map.x2}
              y2={segments.map.y2}
            />,
            mapContainer,
          )
        : null}
    </>
  );
}
