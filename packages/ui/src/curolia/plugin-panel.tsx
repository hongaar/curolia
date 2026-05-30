import type * as React from "react";

import styles from "./plugin-panel.module.css";

export function PluginMutedBox({ children }: { children: React.ReactNode }) {
  return <div className={styles.mutedBox}>{children}</div>;
}

export function PluginSection({ children }: { children: React.ReactNode }) {
  return <div className={styles.section}>{children}</div>;
}

export function PluginRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

export function PluginStatusText({
  children,
  size = "default",
}: {
  children: React.ReactNode;
  size?: "default" | "sm";
}) {
  return (
    <p className={size === "sm" ? styles.statusSm : styles.statusMuted}>
      {children}
    </p>
  );
}

export function PluginSettingsBox({ children }: { children: React.ReactNode }) {
  return <div className={styles.settingsBox}>{children}</div>;
}

export function PluginSettingsRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.settingsRow}>{children}</div>;
}

export function PluginSettingsTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.settingsTitle}>{children}</div>;
}

export function PluginSettingsHint({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.settingsHint}>{children}</p>;
}

export function PluginFeedLabel({ children }: { children: React.ReactNode }) {
  return <span className={styles.feedLabel}>{children}</span>;
}

export function PluginFeedRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.feedRow}>{children}</div>;
}

export function PluginFeedCode({ children }: { children: React.ReactNode }) {
  return <code className={styles.feedCode}>{children}</code>;
}

export const pluginPanelStyles = styles;
