import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./profile-overview.module.css";

export const profileOverviewStyles = styles;

/** Two-column profile page shell: sidebar cards + open map overview. */
export function ProfileOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.layout}>{children}</div>;
}

/** Left column (~1/3 on wide screens) for stacked profile cards. */
export function ProfileOverviewAside({
  children,
}: {
  children: React.ReactNode;
}) {
  return <aside className={styles.aside}>{children}</aside>;
}

/** Right column (~2/3) for map grids and other uncarded overview content. */
export function ProfileOverviewMain({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.main}>{children}</div>;
}

/** Optional follower/following counts shown under the profile bio. */
export function ProfileOverviewStats({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.stats}>{children}</div>;
}

export function ProfileOverviewStat({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

export function ProfileOverviewStatButton({
  label,
  value,
  className,
  ...props
}: {
  label: React.ReactNode;
  value: React.ReactNode;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(styles.statButton, className)}
      {...props}
    >
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </button>
  );
}

export function ProfileOverviewPopoverScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.popoverScroll}>{children}</div>;
}

export function ProfileOverviewFollowPopoverHeader({
  title,
  count,
}: {
  title: React.ReactNode;
  count?: React.ReactNode;
}) {
  return (
    <div className={styles.popoverHeader}>
      <span className={styles.popoverTitle}>{title}</span>
      {count != null ? (
        <span className={styles.popoverCount}>{count}</span>
      ) : null}
    </div>
  );
}

export function ProfileOverviewFollowList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ul className={styles.followList}>{children}</ul>;
}

export function ProfileOverviewFollowListItem({
  avatar,
  name,
  handle,
  onClick,
}: {
  avatar: React.ReactNode;
  name: React.ReactNode;
  handle: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <li className={styles.followListItem}>
      <button
        type="button"
        className={styles.followListButton}
        onClick={onClick}
      >
        <span className={styles.followListAvatar}>{avatar}</span>
        <span className={styles.followListBody}>
          <span className={styles.followListName}>{name}</span>
          <span className={styles.followListHandle}>{handle}</span>
        </span>
      </button>
    </li>
  );
}

/** Vertical stack for avatar, name, and bio inside the profile info card. */
export function ProfileOverviewIdentity({
  avatar,
  name,
  bio,
}: {
  avatar: React.ReactNode;
  name: React.ReactNode;
  bio?: React.ReactNode;
}) {
  return (
    <div className={styles.identity}>
      <div className={styles.avatar}>{avatar}</div>
      <div className={styles.identityText}>
        <h1 className={styles.name}>{name}</h1>
        {bio ? <p className={styles.bio}>{bio}</p> : null}
      </div>
    </div>
  );
}
