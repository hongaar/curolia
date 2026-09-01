import * as React from "react";

import styles from "./place-detail.module.css";

export function PlaceDetailRoot({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}

export function PlaceDetailHeader({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
}) {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      {meta ? <div className={styles.meta}>{meta}</div> : null}
    </header>
  );
}

export function PlaceDetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export function PlaceDetailBodyText({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.bodyText}>{children}</p>;
}

export function PlaceDetailFactList({
  items,
}: {
  items: readonly { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className={styles.factList}>
      {items.map((item) => (
        <div key={item.label} className={styles.factRow}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PlaceDetailActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.actions}>{children}</div>;
}
