import type * as React from "react";

import styles from "./list.module.css";

export function BorderedList({
  children,
  flush = false,
}: {
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <ul className={flush ? styles.borderedListFlush : styles.borderedList}>
      {children}
    </ul>
  );
}

export function ListEmptyItem({ children }: { children: React.ReactNode }) {
  return <li className={styles.listEmpty}>{children}</li>;
}

export function NotificationListButton({
  unread,
  onClick,
  title,
  body,
  meta,
}: {
  unread: boolean;
  onClick: () => void;
  title: React.ReactNode;
  body?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <li className={unread ? styles.listItemUnread : undefined}>
      <button type="button" className={styles.listButton} onClick={onClick}>
        {unread ? (
          <span className={styles.unreadDot} aria-hidden />
        ) : (
          <span className={styles.unreadSpacer} aria-hidden />
        )}
        <span className={styles.listButtonBody}>
          <span className={styles.listButtonTitle}>{title}</span>
          {body ? (
            <span className={styles.listButtonSubtitle}>{body}</span>
          ) : null}
          {meta ? <span className={styles.listButtonMeta}>{meta}</span> : null}
        </span>
      </button>
    </li>
  );
}

export function MemberListRow({ children }: { children: React.ReactNode }) {
  return <li className={styles.memberRow}>{children}</li>;
}

export function MemberAvatar({ children }: { children: React.ReactNode }) {
  return <span className={styles.memberAvatar}>{children}</span>;
}

export function MemberPrimary({
  children,
  secondary,
}: {
  children: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <span className={styles.memberPrimary}>
      {children}
      {secondary ? (
        <span className={styles.memberSecondary}>{secondary}</span>
      ) : null}
    </span>
  );
}

export function MemberRole({ children }: { children: React.ReactNode }) {
  return <span className={styles.memberRole}>{children}</span>;
}

export function MemberActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.memberActions}>{children}</div>;
}
