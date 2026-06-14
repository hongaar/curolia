import type * as React from "react";
import { Link } from "react-router-dom";

import { CardContent, CardHeader, CardTitle } from "../card";
import { PagePanel } from "../page";
import styles from "./pin-detail.module.css";

export { PinDetailDescription } from "./pin-detail-description";

/** @deprecated Use `PagePanel` — same component, shared page shell. */
export const PinDetailCard = PagePanel;

export function PinDetailHeader({ children }: { children: React.ReactNode }) {
  return <CardHeader className={styles.detailHeader}>{children}</CardHeader>;
}

/** Title row with actions on the right; subtitle belongs below this row. */
export function PinDetailHeaderMain({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.detailHeaderMain}>{children}</div>;
}

export function PinDetailTitle({ children }: { children: React.ReactNode }) {
  return <CardTitle className={styles.detailTitle}>{children}</CardTitle>;
}

export function PinDetailSubtitle({ children }: { children: React.ReactNode }) {
  return <p className={styles.detailSubtitle}>{children}</p>;
}

/** Stacked subtitle rows (dates, location/weather, enrichment). */
export function PinDetailSubtitleStack({
  rows,
}: {
  rows: (React.ReactNode | null | undefined | false)[];
}) {
  const filtered = rows.filter(
    (row) => row != null && row !== "" && row !== false,
  );
  if (filtered.length === 0) return null;
  return (
    <div className={styles.detailSubtitleStack}>
      {filtered.map((row, index) => (
        <p key={index} className={styles.detailSubtitle}>
          {row}
        </p>
      ))}
    </div>
  );
}

export function PinDetailTagRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.tagRow}>{children}</div>;
}

export function PinDetailActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.detailActions}>{children}</div>;
}

/** Plugin and edit actions below the title when the header is crowded. */
export function PinDetailActionRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.detailActionRow}>{children}</div>;
}

export function PinDetailContent({ children }: { children: React.ReactNode }) {
  return <CardContent className={styles.detailContent}>{children}</CardContent>;
}

/** Subtitle row with optional trailing controls (e.g. compact trip nav). */
export function PinDetailSubtitleNavRow({
  children,
  trailing,
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  if (!children && !trailing) return null;
  return (
    <div className={styles.subtitleNavRow}>
      {children ? (
        <div className={styles.subtitleNavRowMain}>{children}</div>
      ) : null}
      {trailing ? (
        <div className={styles.subtitleNavRowTrailing}>{trailing}</div>
      ) : null}
    </div>
  );
}

export function PinDetailPhotoRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.photoRow}>{children}</div>;
}

export function PinDetailPhotoPlaceholder({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.photoPlaceholder}>{children}</div>;
}

export function PinDetailInsetMapLink({
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

export function PinDetailInsetMap({ children }: { children: React.ReactNode }) {
  return <div className={styles.insetMap}>{children}</div>;
}

export function PinDetailInsetMapCanvas({
  containerRef,
}: {
  containerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      data-curolia-pin-map
      className={styles.insetMapCanvas}
    />
  );
}

export const pinDetailStyles = styles;
