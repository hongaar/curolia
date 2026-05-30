import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./app-shell.module.css";

export type AppShellLayoutProps = {
  sidebarOpen: boolean;
  overlayMain: boolean;
  onSidebarTransitionEnd?: (event: React.TransitionEvent<HTMLElement>) => void;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  header?: React.ReactNode;
  notifications?: React.ReactNode;
};

export function AppShellLayout({
  sidebarOpen,
  overlayMain,
  onSidebarTransitionEnd,
  sidebar,
  children,
  header,
  notifications,
}: AppShellLayoutProps) {
  return (
    <div className={styles.root}>
      {notifications}
      <div
        className={cn(
          styles.body,
          overlayMain ? styles.bodyRelative : styles.bodyFlex,
        )}
      >
        <aside
          id="curolia-navigation-sidebar"
          aria-hidden={!sidebarOpen}
          inert={sidebarOpen ? undefined : true}
          className={cn(
            styles.sidebar,
            overlayMain ? styles.sidebarOverlay : styles.sidebarInline,
            sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed,
          )}
          onTransitionEnd={onSidebarTransitionEnd}
        >
          <div className={styles.sidebarInner}>{sidebar}</div>
        </aside>
        <div
          data-app-main
          className={cn(
            styles.main,
            overlayMain ? styles.mainFull : styles.mainFlex,
          )}
        >
          <div className={styles.outlet}>{children}</div>
        </div>
      </div>
      {header}
    </div>
  );
}
