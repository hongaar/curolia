import * as React from "react";
import { Link } from "react-router-dom";

import { cn } from "../../lib/utils";
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

export function HomeFeedMapLink({
  to,
  title,
  coverUrl,
  iconEmoji,
  meta,
  className,
  inline = false,
}: {
  to: string;
  title: React.ReactNode;
  coverUrl?: string | null;
  iconEmoji?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  /** Shrink to content (e.g. pin detail source map link). Default list rows span full width. */
  inline?: boolean;
}) {
  const hasCover = Boolean(coverUrl?.trim());

  return (
    <Link
      to={to}
      className={cn(
        styles.mapListLink,
        inline && styles.mapListLinkInline,
        className,
      )}
    >
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
  return (
    <li>
      <HomeFeedMapLink
        to={to}
        title={title}
        coverUrl={coverUrl}
        iconEmoji={iconEmoji}
        meta={meta}
      />
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
