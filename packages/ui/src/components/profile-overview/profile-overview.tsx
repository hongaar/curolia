import type * as React from "react";

import styles from "./profile-overview.module.css";

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
