import type * as React from "react";
import { Link } from "react-router-dom";

import styles from "./blog-ui.module.css";

export function BlogPageRoot({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}

export function BlogFabSlot({ children }: { children: React.ReactNode }) {
  return <div className={styles.fabSlot}>{children}</div>;
}

export function BlogScroll({ children }: { children: React.ReactNode }) {
  return <div className={styles.scroll}>{children}</div>;
}

export function BlogContent({ children }: { children: React.ReactNode }) {
  return <div className={styles.content}>{children}</div>;
}

export function BlogHeader({ children }: { children: React.ReactNode }) {
  return <header className={styles.header}>{children}</header>;
}

export function BlogKicker({ children }: { children: React.ReactNode }) {
  return <p className={styles.kicker}>{children}</p>;
}

export function BlogTitle({ children }: { children: React.ReactNode }) {
  return <h1 className={styles.title}>{children}</h1>;
}

export function BlogLead({ children }: { children: React.ReactNode }) {
  return <p className={styles.lead}>{children}</p>;
}

export function BlogSortTrigger({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button type="button" className={styles.sortTrigger} {...props}>
      {children}
    </button>
  );
}

export function BlogSortChevron({ children }: { children: React.ReactNode }) {
  return <span className={styles.sortChevron}>{children}</span>;
}

export function BlogEmptyPanel({ children }: { children: React.ReactNode }) {
  return <div className={styles.emptyPanel}>{children}</div>;
}

export function BlogTraceList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.traceList}>{children}</ul>;
}

export function BlogTraceDate({
  dateTime,
  children,
}: {
  dateTime?: string;
  children: React.ReactNode;
}) {
  return (
    <time className={styles.traceDate} dateTime={dateTime}>
      {children}
    </time>
  );
}

export function BlogTraceTitle({
  children,
  spaced = false,
}: {
  children: React.ReactNode;
  spaced?: boolean;
}) {
  return (
    <h2
      className={
        spaced
          ? `${styles.traceTitle} ${styles.traceTitleSpaced}`
          : styles.traceTitle
      }
    >
      {children}
    </h2>
  );
}

export function BlogTraceTitleLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link className={styles.traceTitleLink} to={to}>
      {children}
    </Link>
  );
}

export const blogStyles = styles;

export function BlogTagRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.tagRow}>{children}</div>;
}

export function BlogTagBadge({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span className={styles.tagBadge} style={style}>
      {children}
    </span>
  );
}

export function BlogTraceDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.traceDescription}>{children}</p>;
}

export function BlogPhotoGrid({ children }: { children: React.ReactNode }) {
  return <ul className={styles.photoGrid}>{children}</ul>;
}

export function BlogPhotoCell({ children }: { children: React.ReactNode }) {
  return <li className={styles.photoCell}>{children}</li>;
}

export function BlogPhotoSkeleton() {
  return (
    <li>
      <div className={styles.photoSkeleton} />
    </li>
  );
}

export function BlogTraceActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.traceActions}>{children}</div>;
}
