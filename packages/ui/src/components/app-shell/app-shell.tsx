import type * as React from "react";

import styles from "./app-shell.module.css";

export type AppShellLayoutProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  notifications?: React.ReactNode;
};

export function AppShellLayout({
  children,
  header,
  notifications,
}: AppShellLayoutProps) {
  return (
    <div className={styles.root}>
      {notifications}
      <div className={styles.body}>
        <div data-app-main className={styles.main}>
          <div className={styles.outlet}>{children}</div>
        </div>
      </div>
      {header}
    </div>
  );
}
