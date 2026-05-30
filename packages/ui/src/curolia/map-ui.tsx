import type * as React from "react";

import { SheetContent, SheetTitle } from "../components/sheet";
import { cn } from "../lib/utils";
import styles from "./map-ui.module.css";

export function MapPageRoot({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}

export function MapLayer({ children }: { children: React.ReactNode }) {
  return <div className={styles.mapLayer}>{children}</div>;
}

export function MapVignette() {
  return <div className={styles.vignette} aria-hidden />;
}

export function MapHost({ children }: { children: React.ReactNode }) {
  return <div className={styles.mapHost}>{children}</div>;
}

export function MapControlsLayer({ children }: { children: React.ReactNode }) {
  return <div className={styles.controlsLayer}>{children}</div>;
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

export function MapSidebarDismiss({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={open ? 0 : -1}
      className={
        open
          ? `${styles.sidebarDismiss} ${styles.sidebarDismissOpen}`
          : `${styles.sidebarDismiss} ${styles.sidebarDismissClosed}`
      }
      aria-hidden={!open}
      aria-label={open ? "Dismiss navigation sidebar" : undefined}
      onClick={open ? onDismiss : undefined}
    />
  );
}

export function MapPlacementHint({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.placementHint}>
      <p className={styles.placementHintText}>{children}</p>
    </div>
  );
}

export function TraceMapContainer({
  placementMode = false,
  containerRef,
}: {
  placementMode?: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      data-curolia-trace-map
      className={
        placementMode
          ? `${styles.mapContainer} ${styles.mapContainerPlacement}`
          : styles.mapContainer
      }
    />
  );
}

export function TraceMapHoverTooltip({
  floatingRef,
  title,
}: {
  floatingRef?: React.Ref<HTMLDivElement>;
  title: React.ReactNode;
}) {
  return (
    <div ref={floatingRef} className={styles.hoverTooltipHost}>
      <div className={styles.hoverTooltip}>
        <p className={styles.hoverTooltipTitle}>{title}</p>
      </div>
    </div>
  );
}

export function MapToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.toolbarRoot}>{children}</div>;
}

export function MapToolbarIconButton({
  icon,
  label,
  active,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={
        active
          ? `${styles.toolbarButton} ${styles.toolbarButtonActive}`
          : styles.toolbarButton
      }
    >
      <span className={styles.toolbarIconCell}>{icon}</span>
      <span className={styles.toolbarLabelCell}>{label}</span>
    </button>
  );
}

export function TraceMapSidebarBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.sidebarBody}>{children}</div>;
}

export function TraceMapSidebarHeader({
  title,
  actions,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className={styles.sidebarHeader}>
      <h2 className={styles.sidebarTitle}>{title}</h2>
      {actions}
    </div>
  );
}

export function TraceMapSidebarDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.sidebarDescription}>{children}</p>;
}

export function TraceMapSidebarPhotoStrip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.photoStrip}>
      <div className={styles.photoStripInner}>{children}</div>
    </div>
  );
}

export function TraceMapSidebarActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.sidebarActions}>{children}</div>;
}

export function TraceMapSidebarStatus({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.sidebarStatus}>{children}</p>;
}

export function TraceMapSidebarTagRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.sidebarTagRow}>{children}</div>;
}

export function TraceMapSidebarHeaderActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.sidebarHeaderActions}>{children}</div>;
}

export function TraceMapSidebarPhotoSkeleton() {
  return <div className={styles.photoSkeleton} aria-hidden />;
}

export function TraceMapFloatingHost({
  ready,
  hostRef,
  children,
}: {
  ready: boolean;
  hostRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={hostRef}
      className={
        ready
          ? `${styles.floatingHost} ${styles.floatingHostReady}`
          : `${styles.floatingHost} ${styles.floatingHostHidden}`
      }
    >
      <div className={styles.floatingInner}>{children}</div>
    </div>
  );
}

export function TraceMapFloatingPanel({
  children,
  anchored = true,
  fallback = false,
}: {
  children: React.ReactNode;
  anchored?: boolean;
  fallback?: boolean;
}) {
  return (
    <div
      className={cn(
        styles.floatingPanel,
        anchored && styles.floatingPanelAnchored,
        fallback && styles.floatingPanelFallback,
      )}
    >
      {children}
    </div>
  );
}

export function TraceMapMobileSheetBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.mobileSheetBody}>{children}</div>;
}

export function TraceMapMobileSheetContent({
  children,
  ...props
}: React.ComponentProps<typeof SheetContent>) {
  return (
    <SheetContent
      side="bottom"
      showCloseButton={false}
      overlayClassName={styles.mobileSheetOverlay}
      className={cn(styles.mobileSheetContent, props.className)}
      {...props}
    >
      {children}
    </SheetContent>
  );
}

export function TraceMapMobileSheetTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SheetTitle className={styles.mobileSheetTitleHidden}>
      {children}
    </SheetTitle>
  );
}

export function TraceQuickAddHost({
  hostRef,
  children,
}: {
  hostRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div ref={hostRef} className={styles.quickAddHost}>
      <div className={styles.quickAddInner}>
        <div className={styles.quickAddShell}>{children}</div>
      </div>
    </div>
  );
}

export function traceMapMarkerFaceClass(opts: {
  fill: string | null;
  selected: boolean;
  hovered?: boolean;
  interactive: boolean;
  draft?: boolean;
}) {
  const classes = [styles.markerFace];
  if (opts.interactive) classes.push(styles.markerInteractive);
  if (!opts.fill) classes.push(styles.markerDefaultFill);
  if (opts.draft) {
    classes.push(styles.markerDraft);
  } else if (opts.selected) {
    classes.push(styles.markerSelected);
  } else if (opts.hovered) {
    classes.push(styles.markerHovered);
  } else {
    classes.push(styles.markerDefaultRing);
  }
  return classes.join(" ");
}

export const mapStyles = styles;
