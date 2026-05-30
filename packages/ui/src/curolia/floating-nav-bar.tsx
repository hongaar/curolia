import type * as React from "react";

import { buttonClassName } from "../components/button";
import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import styles from "./floating-nav-bar.module.css";

export function FloatingNavBar({
  toolbar,
  accountMenu,
}: {
  toolbar: React.ReactNode;
  accountMenu: React.ReactNode;
}) {
  return (
    <header className={styles.header}>
      {toolbar}
      {accountMenu}
    </header>
  );
}

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
  email,
}: {
  email: string | null | undefined;
}) {
  return (
    <DropdownMenuLabel className={styles.menuSignedIn}>
      <span className={styles.menuSignedIn}>Signed in</span>
      <span className={styles.menuEmail}>{email ?? "—"}</span>
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

export const floatingNavStyles = styles;
