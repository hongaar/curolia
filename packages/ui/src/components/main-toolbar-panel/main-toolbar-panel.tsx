import type * as React from "react";

import { Button } from "../button";
import { cn } from "../../lib/utils";
import { FloatingPanel } from "../floating-panel";
import styles from "./main-toolbar-panel.module.css";

export function MainToolbarShell({ children }: { children: React.ReactNode }) {
  return (
    <FloatingPanel elevated className={styles.panel}>
      {children}
    </FloatingPanel>
  );
}

export function MainToolbarMenuButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(styles.menuButton, className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function MainToolbarMenuIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.menuIcon}>{children}</span>;
}

export function MainToolbarUnreadDot() {
  return <span className={styles.unreadDot} aria-hidden />;
}

export function MainToolbarBrand({ children }: { children: React.ReactNode }) {
  return <span className={styles.brand}>{children}</span>;
}

export function MainToolbarSearchSlot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.searchSlot}>{children}</div>;
}
