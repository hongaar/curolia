import type * as React from "react";

import { cn } from "../lib/utils";
import styles from "./floating-panel.module.css";

export type FloatingPanelProps = React.ComponentProps<"div"> & {
  padding?: "default" | "lg";
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
        padding === "lg" && styles.paddingLg,
        elevated && styles.relative,
        elevated && styles.z10,
        className,
      )}
      {...props}
    />
  );
}
