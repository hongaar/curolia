import type * as React from "react";

import { FloatingPanel } from "./floating-panel";
import { CuroliaLoadingSplash } from "./loading-splash";
import { Text } from "../layout/text";
import styles from "./status-center.module.css";

export function StatusCenterLoader({
  label = "Loading",
  minHeight,
}: {
  label?: string;
  minHeight?: boolean;
}) {
  return (
    <div className={minHeight ? styles.loaderMinHeight : undefined}>
      <CuroliaLoadingSplash statusLabel={label} />
    </div>
  );
}

export function StatusCenterMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.centered}>
      <Text variant="muted">{children}</Text>
    </div>
  );
}

export function StatusCenterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.centered}>
      <FloatingPanel className={styles.centeredPanel}>
        <Text variant="muted">{children}</Text>
      </FloatingPanel>
    </div>
  );
}
