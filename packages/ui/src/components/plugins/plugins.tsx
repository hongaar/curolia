import type * as React from "react";

import styles from "./plugins.module.css";

export function PluginListRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

export function PluginListRowMain({ children }: { children: React.ReactNode }) {
  return <div className={styles.rowMain}>{children}</div>;
}

export function PluginListRowInfo({ children }: { children: React.ReactNode }) {
  return <div className={styles.rowInfo}>{children}</div>;
}

export function PluginListRowTitle({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.rowTitleLine}>
      {icon}
      <p className={styles.rowTitle}>{children}</p>
    </div>
  );
}

export function PluginListRowDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.rowDescription}>{children}</p>;
}

export function PluginListRowHint({ children }: { children: React.ReactNode }) {
  return <p className={styles.rowHint}>{children}</p>;
}

export function PluginListRowToggle({
  label,
  control,
}: {
  label: React.ReactNode;
  control: React.ReactNode;
}) {
  return (
    <div className={styles.rowToggle}>
      <span className={styles.toggleLabel}>{label}</span>
      {control}
    </div>
  );
}

export function PluginListIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.iconMuted}>{children}</span>;
}

export const pluginsUiStyles = styles;
