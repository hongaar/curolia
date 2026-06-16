import type { PinMapHandle } from "@/components/map/pin-map";
import {
  MapBlogPinConnectorInPanel,
  MapBlogPinConnectorMap,
} from "@curolia/ui/map";
import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

/** Radius to stop the map segment before the marker center so the pin sits on top. */
const MARKER_LINE_INSET_PX = 18;
/** Gap between the blog line start and pin title/content. */
const BLOG_LINE_CONTENT_GAP_PX = 12;
/** Offset below the scroll viewport top when the title is offscreen. */
const BLOG_LINE_TOP_INSET_PX = 16;

export type BlogPinConnectorAnchor = {
  titleAnchor: HTMLElement;
  pinEntry: HTMLElement;
};

type BlogPinMapConnectorOverlayProps = {
  show: boolean;
  pinLng: number;
  pinLat: number;
  anchorRef: RefObject<BlogPinConnectorAnchor | null>;
  scrollRootRef: RefObject<HTMLElement | null>;
  blogPanelRef: RefObject<HTMLElement | null>;
  mapRef: RefObject<PinMapHandle | null>;
};

type ConnectorSegments = {
  blog: { x1: number; y1: number; x2: number; y2: number };
  map: { x1: number; y1: number; x2: number; y2: number };
};

function splitConnectorAtBlogEdge(
  titleX: number,
  titleY: number,
  markerX: number,
  markerY: number,
  blogPanelLeft: number,
): { splitX: number; splitY: number } {
  const dx = markerX - titleX;
  if (Math.abs(dx) < 1) {
    return { splitX: blogPanelLeft, splitY: titleY };
  }
  const t = (blogPanelLeft - titleX) / dx;
  return {
    splitX: blogPanelLeft,
    splitY: titleY + t * (markerY - titleY),
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

function computeBlogLineAnchor(
  titleAnchor: HTMLElement,
  pinEntry: HTMLElement,
  scrollRoot: HTMLElement | null,
): { x: number; y: number } {
  const titleRect = titleAnchor.getBoundingClientRect();
  const pinRect = pinEntry.getBoundingClientRect();
  const scrollRect = scrollRoot?.getBoundingClientRect();

  const visibleTop = scrollRect?.top ?? 0;
  const visibleBottom = scrollRect?.bottom ?? window.innerHeight;
  const lockedTopY = visibleTop + BLOG_LINE_TOP_INSET_PX;

  const pinVisibleBottom = Math.min(pinRect.bottom, visibleBottom);
  const titleCenterY = titleRect.top + titleRect.height / 2;
  const titleOffscreenAbove =
    titleRect.bottom <= visibleTop || titleCenterY < lockedTopY;

  let anchorY: number;
  if (titleOffscreenAbove) {
    anchorY = lockedTopY;
  } else {
    const pinVisibleTop = Math.max(pinRect.top, visibleTop);
    anchorY =
      pinVisibleBottom > pinVisibleTop
        ? clamp(titleCenterY, lockedTopY, pinVisibleBottom)
        : titleCenterY;
  }

  return {
    x: titleRect.left - BLOG_LINE_CONTENT_GAP_PX,
    y: anchorY,
  };
}

/** Draws a line from the blog pin title to the map marker while hovered. */
export function BlogPinMapConnectorOverlay({
  show,
  pinLng,
  pinLat,
  anchorRef,
  scrollRootRef,
  blogPanelRef,
  mapRef,
}: BlogPinMapConnectorOverlayProps) {
  const [segments, setSegments] = useState<ConnectorSegments | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLElement | null>(null);
  const [blogPanelEl, setBlogPanelEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!show) return;

    const update = () => {
      const anchor = anchorRef.current;
      const map = mapRef.current;
      const container = map?.getMapContainer() ?? null;
      const blogPanel = blogPanelRef.current;
      if (!anchor || !map || !container || !blogPanel) {
        setSegments(null);
        setMapContainer(null);
        setBlogPanelEl(null);
        return;
      }

      const screen = map.lngLatToScreen(pinLng, pinLat);
      if (!screen) {
        setSegments(null);
        setMapContainer(null);
        setBlogPanelEl(null);
        return;
      }

      const { x: titleX, y: titleY } = computeBlogLineAnchor(
        anchor.titleAnchor,
        anchor.pinEntry,
        scrollRootRef.current,
      );

      const blogPanelLeft =
        blogPanelRef.current?.getBoundingClientRect().left ?? titleX - 1;

      const { splitX, splitY } = splitConnectorAtBlogEdge(
        titleX,
        titleY,
        screen.x,
        screen.y,
        blogPanelLeft,
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
      setBlogPanelEl(blogPanel);
      setSegments({
        blog: { x1: titleX, y1: titleY, x2: splitX, y2: splitY },
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
  }, [show, pinLng, pinLat, anchorRef, scrollRootRef, blogPanelRef, mapRef]);

  if (!show || !segments) return null;

  const blogSegment = (
    <MapBlogPinConnectorInPanel
      x1={segments.blog.x1}
      y1={segments.blog.y1}
      x2={segments.blog.x2}
      y2={segments.blog.y2}
    />
  );

  return (
    <>
      {blogPanelEl ? createPortal(blogSegment, blogPanelEl) : null}
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
