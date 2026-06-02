import type * as React from "react";

import { cn } from "../../lib/utils";
import { DropdownMenuTrigger } from "../dropdown-menu";
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
  hideOnMobile = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
  /** Hide below 40rem (e.g. zoom controls; pinch-to-zoom on mobile). */
  hideOnMobile?: boolean;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={cn(
        styles.button,
        active && styles.buttonActive,
        hideOnMobile && styles.buttonHideOnMobile,
      )}
    >
      <span className={styles.iconCell}>{icon}</span>
      <span className={styles.labelCell}>{label}</span>
    </button>
  );
}

/** Icon-only control for map toolbar stacks (e.g. tag filters). */
export function MapToolbarIconButton({
  icon,
  label,
  active,
  onClick,
  title,
  badgeCount,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  badgeCount?: number;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={label}
      onClick={onClick}
      className={cn(styles.iconButton, active && styles.buttonActive)}
    >
      <span className={styles.iconCell}>{icon}</span>
      {badgeCount != null && badgeCount > 0 ? (
        <span className={styles.badge} aria-hidden>
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      ) : null}
    </button>
  );
}

/** Map-toolbar-styled dropdown trigger (single button, no nested controls). */
export function MapToolbarMenuTrigger({
  icon,
  label,
  active,
  title,
  badgeCount,
  ...props
}: Omit<React.ComponentProps<typeof DropdownMenuTrigger>, "children"> & {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  title?: string;
  badgeCount?: number;
}) {
  return (
    <DropdownMenuTrigger
      type="button"
      title={title ?? label}
      aria-label={label}
      className={cn(styles.menuTrigger, active && styles.buttonActive)}
      {...props}
    >
      <span className={styles.iconCell}>{icon}</span>
      {badgeCount != null && badgeCount > 0 ? (
        <span className={styles.badge} aria-hidden>
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      ) : null}
    </DropdownMenuTrigger>
  );
}
