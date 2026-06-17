import * as React from "react";
import { Link } from "react-router-dom";

import styles from "./home-feed.module.css";

export function HomeFeedLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.homeFeedLayout}>{children}</div>;
}

export function HomeFeedAside({ children }: { children: React.ReactNode }) {
  return <aside className={styles.aside}>{children}</aside>;
}

export function HomeFeedMain({ children }: { children: React.ReactNode }) {
  return <div className={styles.main}>{children}</div>;
}

export function HomeFeedShortcuts({ children }: { children: React.ReactNode }) {
  return (
    <nav className={styles.shortcuts} aria-label="Home shortcuts">
      {children}
    </nav>
  );
}

export function HomeFeedShortcutActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.shortcutActions}>{children}</div>;
}

export function HomeFeedNewMapAction({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.shortcutAction}>{children}</div>;
}

export function HomeFeedMapList({
  title,
  empty,
  children,
}: {
  title: React.ReactNode;
  empty?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasItems = React.Children.count(children) > 0;

  return (
    <section
      className={styles.mapList}
      aria-label={typeof title === "string" ? title : undefined}
    >
      <h2 className={styles.mapListTitle}>{title}</h2>
      {hasItems ? <ul className={styles.mapListItems}>{children}</ul> : empty}
    </section>
  );
}

export function HomeFeedMapListItem({
  to,
  title,
  coverUrl,
  iconEmoji,
  meta,
}: {
  to: string;
  title: React.ReactNode;
  coverUrl?: string | null;
  iconEmoji?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  const hasCover = Boolean(coverUrl?.trim());

  return (
    <li>
      <Link to={to} className={styles.mapListLink}>
        <span className={styles.mapListThumb} aria-hidden>
          {hasCover ? (
            <img src={coverUrl!} alt="" className={styles.mapListThumbImage} />
          ) : (
            <span className={styles.mapListThumbEmoji}>{iconEmoji}</span>
          )}
        </span>
        <span className={styles.mapListBody}>
          <span className={styles.mapListName}>{title}</span>
          {meta ? <span className={styles.mapListMeta}>{meta}</span> : null}
        </span>
      </Link>
    </li>
  );
}

export function HomeFeedMapListEmpty({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.mapListEmpty}>{children}</p>;
}
