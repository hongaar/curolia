import type * as React from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../../lib/utils";
import styles from "./segmented-switcher.module.css";

export function SegmentedSwitcher({
  children,
  "aria-label": ariaLabel,
  size = "default",
  labelMode = "viewport",
}: {
  children: React.ReactNode;
  "aria-label": string;
  size?: "default" | "lg";
  /** `container` hides labels until the map control host is wide enough (~36rem). */
  labelMode?: "viewport" | "container";
}) {
  return (
    <nav
      className={styles.root}
      data-size={size}
      data-label-mode={labelMode}
      aria-label={ariaLabel}
    >
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
  const label = children;
  const title = typeof label === "string" ? label : undefined;

  return (
    <NavLink
      to={to}
      end={end}
      title={title}
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
