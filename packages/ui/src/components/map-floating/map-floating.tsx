import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./map-floating.module.css";

/** Fixed-position host for map popovers positioned via Floating UI. */
export function MapFloatingAnchor({
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
      className={cn(
        styles.anchor,
        ready ? styles.anchorReady : styles.anchorHidden,
      )}
    >
      <div className={styles.anchorInner}>{children}</div>
    </div>
  );
}

export function MapFloatingPanel({
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
        styles.panel,
        anchored && styles.panelAnchored,
        fallback && styles.panelFallback,
      )}
    >
      {children}
    </div>
  );
}

export function MapQuickAddAnchor({
  hostRef,
  children,
}: {
  hostRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div ref={hostRef} className={styles.quickAddAnchor}>
      <div className={styles.quickAddInner}>
        <div className={styles.quickAddShell}>{children}</div>
      </div>
    </div>
  );
}
