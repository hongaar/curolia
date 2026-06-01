import { Loader2 } from "lucide-react";
import type * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../card";
import styles from "./plugin-pin.module.css";

export function PluginPinCard({ children }: { children: React.ReactNode }) {
  return <Card className={styles.card}>{children}</Card>;
}

export function PluginPinHeader({
  children,
  between = false,
}: {
  children: React.ReactNode;
  between?: boolean;
}) {
  return (
    <CardHeader
      className={
        between ? `${styles.header} ${styles.headerBetween}` : styles.header
      }
    >
      {children}
    </CardHeader>
  );
}

export function PluginPinTitleRow({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    <div className={styles.titleRow}>
      <span className={styles.iconMuted}>{icon}</span>
      <CardTitle className={styles.title}>{title}</CardTitle>
    </div>
  );
}

export function PluginPinSpinner() {
  return (
    <span className={styles.spinner} aria-hidden>
      <Loader2 className={styles.spinnerIcon} />
    </span>
  );
}

export function PluginPinContent({ children }: { children: React.ReactNode }) {
  return <CardContent className={styles.contentStack}>{children}</CardContent>;
}

export function PluginPinMuted({ children }: { children: React.ReactNode }) {
  return <p className={styles.muted}>{children}</p>;
}

export function PluginPinMutedXs({ children }: { children: React.ReactNode }) {
  return <p className={styles.mutedXs}>{children}</p>;
}

export function PluginPinMutedStack({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.mutedStack}>{children}</div>;
}

export function PluginPinError({ children }: { children: React.ReactNode }) {
  return <p className={styles.error}>{children}</p>;
}

export function PluginPinList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.trackList}>{children}</ul>;
}

export function PluginPinLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.trackLink}
      >
        <span className={styles.trackIcon}>{icon}</span>
        {children}
      </a>
    </li>
  );
}

export function PluginPinLinkMeta({ children }: { children: React.ReactNode }) {
  return <span className={styles.trackMeta}>{children}</span>;
}
