import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./map-toolbar.module.css";

export function MapToolbar({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}

export function MapToolbarButton({
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
      className={cn(styles.button, active && styles.buttonActive)}
    >
      <span className={styles.iconCell}>{icon}</span>
      <span className={styles.labelCell}>{label}</span>
    </button>
  );
}
