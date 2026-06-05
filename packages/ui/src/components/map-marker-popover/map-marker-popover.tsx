import type * as React from "react";

import { cn } from "../../lib/utils";
import { MarkdownContent } from "../markdown-content";
import { SheetContent, SheetTitle } from "../sheet";
import styles from "./map-marker-popover.module.css";

export function MapMarkerPopoverBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.body}>{children}</div>;
}

export function MapMarkerPopoverHeader({
  title,
  actions,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {actions}
    </div>
  );
}

export function MapMarkerPopoverDescription({
  markdown,
}: {
  markdown: string;
}) {
  return <MarkdownContent className={styles.description} markdown={markdown} />;
}

export function MapMarkerPopoverPhotoStrip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.photoStrip}>
      <div className={styles.photoStripInner}>{children}</div>
    </div>
  );
}

export function MapMarkerPopoverActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.actions}>{children}</div>;
}

export function MapMarkerPopoverStatus({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.status}>{children}</p>;
}

/** Stacked status rows for pin subtitles (dates, location/weather, enrichment). */
export function MapMarkerPopoverStatusStack({
  rows,
}: {
  rows: (React.ReactNode | null | undefined | false)[];
}) {
  const filtered = rows.filter(
    (row) => row != null && row !== "" && row !== false,
  );
  if (filtered.length === 0) return null;
  return (
    <div className={styles.statusStack}>
      {filtered.map((row, index) => (
        <p key={index} className={styles.status}>
          {row}
        </p>
      ))}
    </div>
  );
}

export function MapMarkerPopoverTagRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.tagRow}>{children}</div>;
}

export function MapMarkerPopoverHeaderActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.headerActions}>{children}</div>;
}

export function MapMarkerPopoverPhotoSkeleton() {
  return <div className={styles.photoSkeleton} aria-hidden />;
}

/** Bottom sheet wrapper for the marker popover on small viewports. */
export function MapMarkerPopoverSheetBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.mobileSheetBody}>{children}</div>;
}

export function MapMarkerPopoverSheetContent({
  children,
  ...props
}: React.ComponentProps<typeof SheetContent>) {
  return (
    <SheetContent
      side="bottom"
      showCloseButton={false}
      overlayClassName={styles.mobileSheetOverlay}
      className={cn(styles.mobileSheetContent, props.className)}
      {...props}
    >
      {children}
    </SheetContent>
  );
}

export function MapMarkerPopoverSheetTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SheetTitle className={styles.mobileSheetTitleHidden}>
      {children}
    </SheetTitle>
  );
}
