import type * as React from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../../lib/utils";
import styles from "./segmented-switcher.module.css";

export function SegmentedSwitcher({
  children,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <nav className={styles.root} aria-label={ariaLabel}>
      {children}
    </nav>
  );
}

export function SegmentedSwitcherLink({
  to,
  end,
  icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(styles.link, isActive && styles.linkActive)
      }
    >
      {icon ? (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
    </NavLink>
  );
}
