import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./plugin-icon-frame.module.css";

export function PluginIconFrame({
  size = 4,
  children,
  className,
}: {
  size?: 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}) {
  const sizeClass =
    size === 6 ? styles.size6 : size === 5 ? styles.size5 : styles.size4;
  return (
    <span className={cn(styles.frame, sizeClass, className)}>{children}</span>
  );
}
