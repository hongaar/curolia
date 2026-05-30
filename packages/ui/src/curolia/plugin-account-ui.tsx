import type * as React from "react";

import styles from "./plugin-account-ui.module.css";

export function PluginAccountPanel({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact ? `${styles.panel} ${styles.panelCompact}` : styles.panel
      }
    >
      {children}
    </div>
  );
}

export function PluginAccountHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.heading}>{children}</p>;
}

export function PluginAccountRow({
  children,
  between = true,
  gap = "md",
}: {
  children: React.ReactNode;
  between?: boolean;
  gap?: "md" | "sm";
}) {
  return (
    <div
      className={
        between
          ? gap === "sm"
            ? `${styles.row} ${styles.rowGapSm} ${styles.rowBetween}`
            : `${styles.row} ${styles.rowBetween}`
          : gap === "sm"
            ? `${styles.row} ${styles.rowGapSm}`
            : styles.row
      }
    >
      {children}
    </div>
  );
}

export function PluginAccountBody({ children }: { children: React.ReactNode }) {
  return <p className={styles.body}>{children}</p>;
}

export function PluginAccountMuted({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.muted}>{children}</p>;
}

export function PluginAccountName({ children }: { children: React.ReactNode }) {
  return <span className={styles.accountName}>{children}</span>;
}

export function PluginAccountInputRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.inputRow}>{children}</div>;
}

export const pluginAccountButtonClass = styles.buttonRounded;
export const pluginAccountInputClass = styles.inputMax;
export const pluginAccountInputDescriptionClass = styles.inputDescription;
