import * as React from "react";

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
  /** Visible label beside the icon. Omit for icon-only FAB. */
  label?: string;
};

export const FabButton = React.forwardRef<HTMLButtonElement, FabButtonProps>(
  function FabButton({ active, title, onClick, icon, label }, ref) {
    const iconOnly = label == null || label === "";

    return (
      <Button
        ref={ref}
        type="button"
        variant={active ? "secondary" : "default"}
        title={title}
        onClick={onClick}
        aria-pressed={active || undefined}
        aria-label={iconOnly ? title : undefined}
        className={cn(
          styles.root,
          iconOnly && styles.rootIconOnly,
          active && styles.rootActive,
        )}
      >
        <span className={styles.icon}>{icon}</span>
        {iconOnly ? null : <span>{label}</span>}
      </Button>
    );
  },
);
