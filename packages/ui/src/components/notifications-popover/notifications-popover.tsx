import type * as React from "react";

import { buttonClassName } from "../button";
import { PopoverContent, PopoverTrigger } from "../popover";
import styles from "./notifications-popover.module.css";

export function NotificationsPopoverContent({
  children,
  align,
  sideOffset,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
  sideOffset?: number;
}) {
  return (
    <PopoverContent
      align={align}
      side="bottom"
      sideOffset={sideOffset}
      className={styles.popoverWide}
    >
      {children}
    </PopoverContent>
  );
}

export function NotificationsPopoverHeader({
  title,
  action,
}: {
  title: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div className={styles.popoverHeader}>
      <span className={styles.popoverTitle}>{title}</span>
      {action}
    </div>
  );
}

export function NotificationsSeeAllButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={buttonClassName({
        variant: "ghost",
        size: "sm",
        className: styles.seeAllButton,
      })}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function NotificationsPopoverScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.scroll}>{children}</div>;
}

export function NotificationsPopoverItem({
  unread,
  onClick,
  title,
  body,
}: {
  unread: boolean;
  onClick: () => void;
  title: React.ReactNode;
  body?: React.ReactNode;
}) {
  return (
    <li className={styles.itemBorder}>
      <button
        type="button"
        className={
          unread
            ? `${styles.itemButton} ${styles.itemButtonUnread}`
            : styles.itemButton
        }
        onClick={onClick}
      >
        <span className={styles.itemRow}>
          {unread ? (
            <span className={styles.unreadDot} aria-hidden />
          ) : (
            <span className={styles.unreadSpacer} aria-hidden />
          )}
          <span className={styles.itemBody}>
            <span className={styles.itemTitle}>{title}</span>
            {body ? <span className={styles.itemSubtitle}>{body}</span> : null}
          </span>
        </span>
      </button>
    </li>
  );
}

export function NotificationsIconPopoverTrigger({
  children,
  ...props
}: React.ComponentProps<typeof PopoverTrigger>) {
  return (
    <PopoverTrigger
      className={buttonClassName({
        variant: "ghost",
        size: "icon",
        className: styles.iconTrigger,
      })}
      {...props}
    >
      {children}
    </PopoverTrigger>
  );
}

export function NotificationsIconTrigger({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={buttonClassName({
        variant: "ghost",
        size: "icon",
        className: styles.iconTrigger,
      })}
      {...props}
    >
      {children}
    </button>
  );
}

export const notificationsPopoverStyles = styles;
