import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./floating-panel.module.css";

export type FloatingPanelProps = React.ComponentProps<"div"> & {
  /** Inner padding token: `default`, `lg`, or `none`. */
  padding?: "default" | "lg" | "none";
  /** Adds elevation stacking context for toolbars and login card. */
  elevated?: boolean;
};

export function FloatingPanel({
  padding = "default",
  elevated = false,
  className,
  ...props
}: FloatingPanelProps) {
  return (
    <div
      className={cn(
        styles.root,
        padding === "default" && styles.paddingDefault,
        padding === "lg" && styles.paddingLg,
        padding === "none" && styles.paddingNone,
        elevated && styles.relative,
        elevated && styles.z10,
        className,
      )}
      {...props}
    />
  );
}
