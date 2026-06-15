import type * as React from "react";
import { Link } from "react-router-dom";

import styles from "./home-feed.module.css";

export function HomeFeedLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.homeFeedLayout}>{children}</div>;
}

export function HomeFeedAside({ children }: { children: React.ReactNode }) {
  return <aside className={styles.aside}>{children}</aside>;
}

export function HomeFeedMain({ children }: { children: React.ReactNode }) {
  return <div className={styles.main}>{children}</div>;
}

export function HomeFeedShortcuts({ children }: { children: React.ReactNode }) {
  return (
    <nav className={styles.shortcuts} aria-label="Home shortcuts">
      {children}
    </nav>
  );
}

export function HomeFeedNewMapAction({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.newMapAction}>{children}</div>;
}

export function HomeFeedShortcutLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className={styles.shortcutLink}>
      <span className={styles.shortcutIcon} aria-hidden>
        {icon}
      </span>
      {children}
    </Link>
  );
}
