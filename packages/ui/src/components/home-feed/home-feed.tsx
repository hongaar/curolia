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

/** Sidebar link to the signed-in user's profile: avatar plus two text rows. */
export function HomeFeedProfileLink({
  to,
  avatar,
  title,
  subtitle,
}: {
  to: string;
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
}) {
  return (
    <Link to={to} className={styles.profileLink}>
      <span className={styles.profileAvatar}>{avatar}</span>
      <span className={styles.mapListBody}>
        <span className={styles.mapListName}>{title}</span>
        <span className={styles.profileSubtitle}>{subtitle}</span>
      </span>
    </Link>
  );
}

/** Sidebar section listing changelog entries, with an optional header action. */
export function HomeFeedChangelog({
  title,
  action,
  empty,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  empty?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const hasItems = React.Children.count(children) > 0;

  return (
    <section
      className={styles.changelog}
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className={styles.changelogHeader}>
        <h2 className={styles.changelogTitle}>{title}</h2>
        {action}
      </div>
      {hasItems ? <ul className={styles.changelogItems}>{children}</ul> : empty}
    </section>
  );
}

export function HomeFeedChangelogItem({
  date,
  imageUrl,
  actions,
  children,
}: {
  date: React.ReactNode;
  imageUrl?: string | null;
  /** Admin controls (edit/delete), shown beside the date. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className={styles.changelogItem}>
      <div className={styles.changelogMeta}>
        <span className={styles.changelogDate}>{date}</span>
        {actions ? (
          <span className={styles.changelogActions}>{actions}</span>
        ) : null}
      </div>
      {imageUrl?.trim() ? (
        <img src={imageUrl} alt="" className={styles.changelogImage} />
      ) : null}
      <div className={styles.changelogDescription}>{children}</div>
    </li>
  );
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
