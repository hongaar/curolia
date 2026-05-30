import type * as React from "react";

import { Button } from "../components/button";
import { cn } from "../lib/utils";
import styles from "./add-trace-fab.module.css";

export function AddTraceFabButton({
  active,
  title,
  onClick,
  icon,
  label,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "default"}
      title={title}
      onClick={onClick}
      aria-pressed={active || undefined}
      className={cn(styles.root, active && styles.rootActive)}
    >
      <span className={styles.icon}>{icon}</span>
      <span>{label}</span>
    </Button>
  );
}
