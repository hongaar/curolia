import type * as React from "react";

import { buttonClassName } from "../button";
import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import styles from "./floating-nav-bar.module.css";

export function AccountMenuTrigger({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      className={buttonClassName({
        variant: "outline",
        className: styles.accountTrigger,
      })}
      {...props}
    >
      {children}
    </DropdownMenuTrigger>
  );
}

export function AccountMenuContent({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent align="end" className={styles.menuWidth} {...props}>
      {children}
    </DropdownMenuContent>
  );
}

export function AccountMenuSignedInLabel({
  displayName,
  email,
}: {
  displayName?: string | null;
  email?: string | null;
}) {
  const label = displayName?.trim() || email || "—";

  return (
    <DropdownMenuLabel className={styles.menuSignedIn}>
      <span className={styles.menuSignedIn}>Signed in</span>
      <span className={styles.menuEmail}>{label}</span>
    </DropdownMenuLabel>
  );
}

export function AccountMenuItemIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.menuIcon}>{children}</span>;
}

export function AccountMenuItemLabel({
  children,
  showUnreadDot = false,
}: {
  children: React.ReactNode;
  showUnreadDot?: boolean;
}) {
  return (
    <span className={styles.menuItemLabel}>
      {children}
      {showUnreadDot ? (
        <span className={styles.menuItemUnreadDot} aria-hidden />
      ) : null}
    </span>
  );
}

export const floatingNavStyles = styles;
