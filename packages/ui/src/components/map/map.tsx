import * as React from "react";
import { useLayoutEffect, useState } from "react";

import { cn } from "../../lib/utils";
import styles from "./map.module.css";

export function MapPageRoot({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}

export function MapLayer({
  children,
  panelRightWidth,
}: {
  children: React.ReactNode;
  panelRightWidth?: string;
}) {
  return (
    <div
      className={styles.mapLayer}
      data-curolia-map-layer
      style={
        panelRightWidth
          ? ({ "--map-panel-right": panelRightWidth } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}

export const MapBlogSidePanel = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(function MapBlogSidePanel({ children }, ref) {
  return (
    <div ref={ref} className={styles.blogSidePanel}>
      {children}
    </div>
  );
});

export function MapBlogSidePanelScroll({
  children,
  ref,
}: {
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className={styles.blogSidePanelScroll}>
      {children}
    </div>
  );
}

export function MapBlogSidePanelContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.blogSidePanelContent}>{children}</div>;
}

export function MapBlogSidePanelPinBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.blogSidePanelPinBody}>{children}</div>;
}

/** Full-width header region above the gallery grid in the map side panel. */
export function MapBlogSidePanelGalleryHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.blogSidePanelGalleryHeader}>{children}</div>;
}

/** Photo gallery region within the blog side panel (respects panel scroll padding). */
export function MapBlogSidePanelGallery({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.blogSidePanelGallery}>{children}</div>;
}

const BLOG_SIDE_PANEL_SCRIM_MS = 220;

export function MapBlogSidePanelScrim({
  onDismiss,
  show,
}: {
  onDismiss: () => void;
  show: boolean;
}) {
  const [mounted, setMounted] = useState(show);
  const [active, setActive] = useState(false);

  useLayoutEffect(() => {
    if (show) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(raf);
    }
    setActive(false);
    const timer = window.setTimeout(
      () => setMounted(false),
      BLOG_SIDE_PANEL_SCRIM_MS,
    );
    return () => clearTimeout(timer);
  }, [show]);

  if (!mounted) return null;

  return (
    <button
      type="button"
      className={cn(
        styles.blogSidePanelScrim,
        active && styles.blogSidePanelScrimActive,
      )}
      aria-label="Close pin details"
      onClick={onDismiss}
    />
  );
}

export const MapSidePanel = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    /** Slide-in when the user selects a map marker; omit on URL restore / navigation. */
    animateIn?: boolean;
  }
>(function MapSidePanel({ children, animateIn = false }, ref) {
  return (
    <div
      ref={ref}
      className={cn(styles.sidePanel, animateIn && styles.sidePanelEnter)}
    >
      {children}
    </div>
  );
});

export function MapVignette() {
  return <div className={styles.vignette} aria-hidden />;
}

export function MapHost({ children }: { children: React.ReactNode }) {
  return <div className={styles.mapHost}>{children}</div>;
}

export function MapControlsLayer({ children }: { children: React.ReactNode }) {
  return <div className={styles.controlsLayer}>{children}</div>;
}

export function MapControlsTopLeft({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.controlsTopLeft}>{children}</div>;
}

export function MapControlsTopRight({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.controlsTopRight}>{children}</div>;
}

export function MapControlsBottomRight({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.controlsBottomRight}>{children}</div>;
}

/** Vertical stack of map controls (tags, toolbar, FAB) at bottom-right. */
export function MapControlsBottomStack({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.controlsBottomStack}>{children}</div>;
}

/** Floating control anchored to the bottom center of the map/blog view. */
export function MapControlsBottomCenter({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.controlsBottomCenter}>{children}</div>;
}

export function MapPlacementHint({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.placementHint}>
      <p className={styles.placementHintText}>{children}</p>
    </div>
  );
}

export function MapCanvas({
  placementMode = false,
  containerRef,
}: {
  placementMode?: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      data-curolia-pin-map
      className={
        placementMode
          ? `${styles.mapCanvas} ${styles.mapCanvasPlacement}`
          : styles.mapCanvas
      }
    />
  );
}

/** Line from a blog pin title to its map marker (viewport coordinates). */
export function MapBlogPinConnector({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <svg
      className={styles.blogPinConnector}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        className={styles.blogPinConnectorLine}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
      />
    </svg>
  );
}

/** Blog segment portaled into the side panel — below pin content and gallery. */
export function MapBlogPinConnectorInPanel({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <svg
      className={styles.blogPinConnectorInPanel}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        className={styles.blogPinConnectorLine}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
      />
    </svg>
  );
}

/** Map-local segment — portaled into the map canvas, below pin markers. */
export function MapBlogPinConnectorMap({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <svg
      className={styles.blogPinConnectorMap}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        className={styles.blogPinConnectorLine}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
      />
    </svg>
  );
}

export const mapStyles = styles;
