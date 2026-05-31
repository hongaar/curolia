import type * as React from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "../card";
import styles from "./trace-detail.module.css";

export function TraceDetailCard({ children }: { children: React.ReactNode }) {
  return <Card className={styles.detailCard}>{children}</Card>;
}

export function TraceDetailHeader({ children }: { children: React.ReactNode }) {
  return <CardHeader className={styles.detailHeader}>{children}</CardHeader>;
}

export function TraceDetailTitle({ children }: { children: React.ReactNode }) {
  return <CardTitle className={styles.detailTitle}>{children}</CardTitle>;
}

export function TraceDetailSubtitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.detailSubtitle}>{children}</p>;
}

export function TraceDetailTagRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.tagRow}>{children}</div>;
}

export function TraceDetailActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.detailActions}>{children}</div>;
}

export function TraceDetailContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CardContent className={styles.detailContent}>{children}</CardContent>;
}

export function TraceDetailDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.description}>{children}</p>;
}

export function TraceDetailPhotoRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.photoRow}>{children}</div>;
}

export function TraceDetailPhotoPlaceholder({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.photoPlaceholder}>{children}</div>;
}

export function TraceDetailTagBadge({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span className={styles.badgePlain} style={style}>
      {children}
    </span>
  );
}

export function TraceDetailInsetMapLink({
  to,
  children,
  ariaLabel,
}: {
  to: string;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <Link to={to} className={styles.insetMapLink} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function TraceDetailInsetMap({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.insetMap}>{children}</div>;
}

export function TraceDetailInsetMapCanvas({
  containerRef,
}: {
  containerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      data-curolia-trace-map
      className={styles.insetMapCanvas}
    />
  );
}

export const traceDetailStyles = styles;
