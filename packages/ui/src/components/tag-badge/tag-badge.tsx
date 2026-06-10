import type * as React from "react";

import styles from "./tag-badge.module.css";

export function TagBadge({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span className={styles.root} style={style}>
      {children}
    </span>
  );
}
