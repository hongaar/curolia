import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./plugin-icon-frame.module.css";

export type PluginIconFrameProps = {
  /** Frame size in rem units: `4`, `5`, or `6`. */
  size?: 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
};

export function PluginIconFrame({
  size = 4,
  children,
  className,
}: PluginIconFrameProps) {
  const sizeClass =
    size === 6 ? styles.size6 : size === 5 ? styles.size5 : styles.size4;
  return (
    <span className={cn(styles.frame, sizeClass, className)}>{children}</span>
  );
}
