import * as React from "react";

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

export const mapStyles = styles;
