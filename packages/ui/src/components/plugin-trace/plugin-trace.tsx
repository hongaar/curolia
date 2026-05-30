import type * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../card";
import styles from "./plugin-trace.module.css";

export function PluginTraceCard({ children }: { children: React.ReactNode }) {
  return <Card className={styles.card}>{children}</Card>;
}

export function PluginTraceHeader({
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

export function PluginTraceTitleRow({
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

export function PluginTraceSpinner({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.spinner}>{children}</span>;
}

export function PluginTraceContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CardContent className={styles.contentStack}>{children}</CardContent>;
}

export function PluginTraceMuted({ children }: { children: React.ReactNode }) {
  return <p className={styles.muted}>{children}</p>;
}

export function PluginTraceMutedXs({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.mutedXs}>{children}</p>;
}

export function PluginTraceMutedStack({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.mutedStack}>{children}</div>;
}

export function PluginTraceError({ children }: { children: React.ReactNode }) {
  return <p className={styles.error}>{children}</p>;
}

export function PluginTraceList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.trackList}>{children}</ul>;
}

export function PluginTraceLink({
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

export function PluginTraceLinkMeta({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.trackMeta}>{children}</span>;
}
