import { Settings2 } from "lucide-react";
import type * as React from "react";

import { Button } from "../button";
import styles from "./plugins.module.css";

export function PluginGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

export function PluginGridCard({
  children,
  unavailable = false,
}: {
  children: React.ReactNode;
  unavailable?: boolean;
}) {
  return (
    <article
      className={
        unavailable ? `${styles.card} ${styles.cardUnavailable}` : styles.card
      }
    >
      {children}
    </article>
  );
}

export function PluginGridCardTop({ children }: { children: React.ReactNode }) {
  return <div className={styles.cardTop}>{children}</div>;
}

export function PluginGridCardIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.cardIcon}>{children}</span>;
}

export function PluginGridCardHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.cardHeading}>{children}</div>;
}

export function PluginGridCardTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <h3 className={styles.cardTitle}>{children}</h3>;
}

export function PluginGridCardDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.cardDescription}>{children}</p>;
}

export function PluginGridCardToggle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.cardToggle}>{children}</div>;
}

export function PluginGridCardFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.cardFooter}>{children}</div>;
}

export function PluginGridCardFooterRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.cardFooterRow}>{children}</div>;
}

export function PluginGridCardActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.cardActions}>{children}</div>;
}

export function PluginGridCardConfigureButton({
  onClick,
  label = "Configure",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <Settings2 aria-hidden />
      {label}
    </Button>
  );
}

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
