import type * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import styles from "./fab.module.css";

export type FabButtonProps = {
  /** Pressed state for toggle-style FAB (secondary variant). */
  active?: boolean;
  /** Native `title` tooltip on the button. */
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  /** Visible label beside the icon. */
  label: string;
};

export function FabButton({
  active,
  title,
  onClick,
  icon,
  label,
}: FabButtonProps) {
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
